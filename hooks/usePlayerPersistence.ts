'use client';

import { useEffect, useState } from 'react';

/**
 * Persists user preferences across sessions via localStorage and applies them
 * to the <video> element on first ready.
 *
 * Lives alongside `usePlayerState` — both subscribe to the same video element
 * but for different concerns: `usePlayerState` exposes state to React,
 * `usePlayerPersistence` syncs that state to localStorage.
 *
 * UI-controlled prefs (`autoPlayNext`, `preferredServerName`) are returned as
 * React state for the settings menu to bind to.
 */

const LS_KEY = 'mw_player_prefs_v1';

interface StoredPrefs {
  volume?: number;
  muted?: boolean;
  playbackRate?: number;
  autoPlayNext?: boolean;
  preferredServerName?: string | null;
}

function readPrefs(): StoredPrefs {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function writePrefs(prefs: StoredPrefs) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage quota or privacy mode — silently skip.
  }
}

export interface UsePlayerPersistenceReturn {
  autoPlayNext: boolean;
  setAutoPlayNext: (v: boolean) => void;
  preferredServerName: string | null;
  setPreferredServerName: (name: string | null) => void;
}

export function usePlayerPersistence(
  videoRef: React.RefObject<HTMLVideoElement | null>
): UsePlayerPersistenceReturn {
  // Seed from localStorage synchronously so the first render of the menu
  // shows the right toggle state. Falls back to defaults on SSR.
  const seed = typeof window === 'undefined' ? {} : readPrefs();

  const [autoPlayNext, setAutoPlayNextState] = useState<boolean>(seed.autoPlayNext ?? true);
  const [preferredServerName, setPreferredServerNameState] = useState<string | null>(
    seed.preferredServerName ?? null
  );

  // Apply volume / muted / rate to the <video> element on first mount. Wait
  // for the element to exist — it might not on the first render before HLS
  // attaches. Use a one-shot effect that finds the element and applies.
  useEffect(() => {
    const apply = () => {
      const v = videoRef.current;
      if (!v) return false;
      const p = readPrefs();
      if (typeof p.volume === 'number') v.volume = Math.max(0, Math.min(1, p.volume));
      if (typeof p.muted === 'boolean') v.muted = p.muted;
      if (typeof p.playbackRate === 'number') v.playbackRate = p.playbackRate;
      return true;
    };
    if (apply()) return;

    // Element wasn't mounted yet (rare) — retry on the next frame a few times.
    let tries = 0;
    const id = setInterval(() => {
      tries++;
      if (apply() || tries > 10) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, [videoRef]);

  // Save volume/muted/rate on every change via the same media events
  // `usePlayerState` listens to. Coalesces multiple events safely because
  // each writes the full prefs object.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const save = () => {
      const prev = readPrefs();
      writePrefs({
        ...prev,
        volume: v.volume,
        muted: v.muted,
        playbackRate: v.playbackRate,
      });
    };
    v.addEventListener('volumechange', save);
    v.addEventListener('ratechange', save);
    return () => {
      v.removeEventListener('volumechange', save);
      v.removeEventListener('ratechange', save);
    };
  }, [videoRef]);

  const setAutoPlayNext = (val: boolean) => {
    setAutoPlayNextState(val);
    writePrefs({ ...readPrefs(), autoPlayNext: val });
  };

  const setPreferredServerName = (name: string | null) => {
    setPreferredServerNameState(name);
    writePrefs({ ...readPrefs(), preferredServerName: name });
  };

  return { autoPlayNext, setAutoPlayNext, preferredServerName, setPreferredServerName };
}
