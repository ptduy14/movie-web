'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Can this browser load the catalog stream — and if not, why?
 *
 * The stream CDN only answers Vietnamese IPs (verified 2026-10-16: a VNPT
 * line gets 200, the same machine behind Cloudflare WARP gets a 404 page
 * saying "Vui lòng sử dụng mạng trong nước"). Plenty of Vietnamese viewers
 * run WARP (1.1.1.1) or a VPN without thinking about it, so "the video won't
 * load" is often fixable by the viewer — if we tell them what to switch off.
 *
 * Detection, all in the browser:
 *
 *  1. Fetch the playlist itself. A `#EXTM3U` body means fine. The block page
 *     carries no CORS header, so a blocked fetch THROWS rather than
 *     returning 404 — a throw is the signal.
 *  2. Ask Cloudflare's public trace endpoint (CORS `*`) what it sees:
 *     `warp=on|plus` proves WARP, `loc` is the exit country.
 *  3. The browser's time zone stands in for "where the person actually is".
 *
 * Nothing about the viewer leaves the browser: no IP is logged or sent
 * anywhere, only the resulting `reason` enum reaches analytics.
 *
 * Geo-IP databases disagree — ipinfo calls a WARP exit in Cần Thơ "VN", the
 * stream CDN calls it "美国" — so step 1 is the only verdict that counts;
 * steps 2–3 only choose the wording.
 */

export type StreamReason =
  /** Cloudflare WARP is on. */
  | 'warp'
  /** Exit IP is outside Vietnam but the clock says Vietnam: a VPN. */
  | 'vpn'
  /** Outside Vietnam for real. The fallback source is the answer. */
  | 'abroad'
  /** In Vietnam, no VPN, still failing: the CDN or this link is down. */
  | 'cdn'
  /** The trace endpoint was unreachable too (adblock, firewall). */
  | 'unknown';

export type StreamStatus = 'idle' | 'checking' | 'ok' | 'blocked';

export interface StreamReachability {
  status: StreamStatus;
  reason: StreamReason | null;
  /** Re-run both checks, e.g. after the viewer turned WARP off. */
  retry: () => void;
}

const PROBE_TIMEOUT_MS = 6000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_KEY = 'mx:stream-reach';
const TRACE_URL = 'https://www.cloudflare.com/cdn-cgi/trace';
const VN_TIME_ZONES = new Set(['Asia/Ho_Chi_Minh', 'Asia/Saigon']);

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    return await fetch(url, { cache: 'no-store', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function probeStream(url: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return false;
    const head = (await res.text()).slice(0, 16);
    return head.startsWith('#EXTM3U');
  } catch {
    return false;
  }
}

async function readTrace(): Promise<{ warp: boolean; loc: string } | null> {
  try {
    const res = await fetchWithTimeout(TRACE_URL);
    if (!res.ok) return null;
    const fields = Object.fromEntries(
      (await res.text())
        .split('\n')
        .map((line) => line.split('='))
        .filter((pair) => pair.length === 2)
    ) as Record<string, string>;
    return { warp: fields.warp === 'on' || fields.warp === 'plus', loc: fields.loc ?? '' };
  } catch {
    return null;
  }
}

function inVietnamTimeZone(): boolean {
  try {
    return VN_TIME_ZONES.has(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    return false;
  }
}

/** Decide the reason once the stream probe has failed. */
export function classifyBlock(
  trace: { warp: boolean; loc: string } | null,
  vnClock: boolean
): StreamReason {
  if (trace?.warp) return 'warp';
  if (trace && trace.loc && trace.loc !== 'VN') return vnClock ? 'vpn' : 'abroad';
  if (trace) return 'cdn';
  return vnClock ? 'unknown' : 'abroad';
}

type Cached = { at: number; reason: StreamReason | null };

function readCache(): Cached | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached;
    return Date.now() - parsed.at < CACHE_TTL_MS ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(reason: StreamReason | null) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), reason }));
  } catch {
    // Private mode / storage blocked — just probe again next time.
  }
}

/**
 * @param probeUrl The playlist to test. Empty string = nothing to test
 *   (title has no catalog stream); status stays `idle`.
 *
 * A passing result is cached for ten minutes per tab, so switching episodes
 * doesn't re-probe. A failing result is cached too, but only skips the
 * trace lookup — the stream probe always reruns, because the cheapest
 * outcome is "it works now".
 */
export function useStreamReachability(probeUrl: string): StreamReachability {
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [reason, setReason] = useState<StreamReason | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!probeUrl) {
      setStatus('idle');
      setReason(null);
      return;
    }

    let cancelled = false;
    const cached = attempt === 0 ? readCache() : null;
    if (cached && cached.reason === null) {
      setStatus('ok');
      setReason(null);
      return;
    }

    setStatus('checking');
    (async () => {
      const reachable = await probeStream(probeUrl);
      if (cancelled) return;
      if (reachable) {
        writeCache(null);
        setStatus('ok');
        setReason(null);
        return;
      }
      const verdict = cached?.reason ?? classifyBlock(await readTrace(), inVietnamTimeZone());
      if (cancelled) return;
      writeCache(verdict);
      setStatus('blocked');
      setReason(verdict);
    })();

    return () => {
      cancelled = true;
    };
  }, [probeUrl, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { status, reason, retry };
}
