import type { MediaType } from 'constants/tmdb-taxonomy';

/**
 * vidsrc.sh — the playback provider.
 *
 * vidsrc exposes no catalog API worth the name: there is no search, no
 * metadata, no browse. What it gives us is three things, and this module is
 * the only place that knows about any of them:
 *
 *   1. `/embed/...`            — the iframe URL for a title (the whole point)
 *   2. `/{kind}/latest/*.json` — the 250 most recently added items
 *   3. `/ids/*.txt`            — every id it can play, refreshed daily
 *
 * Everything the user reads on the page comes from TMDB instead; see
 * `services/tmdb-catalog-service.ts`.
 */

const VIDSRC_DOMAIN = (process.env.NEXT_PUBLIC_VIDSRC_DOMAIN || 'https://vidsrc.sh').replace(
  /\/+$/,
  ''
);

const FETCH_TIMEOUT_MS = 15000;

// ============================================================================
// EMBED URLS
// ============================================================================

export interface EmbedOptions {
  type: MediaType;
  /** TMDB numeric id. Preferred — it is the one id the catalog always has. */
  tmdbId?: string | number;
  /** IMDb id (`tt…`). Used when a TMDB id is unavailable. */
  imdbId?: string | null;
  /** TV only. Omit both to open the player's own season/episode picker. */
  season?: number;
  episode?: number;
  /** Resume position in seconds. */
  startAt?: number;
  /** Subtitle language preference, up to 3, highest priority first. */
  dsLang?: string[];
  /** TV only — play the next episode automatically when one ends. */
  autoNext?: boolean;
  /** External subtitle file. Must be https AND served with CORS headers:
   *  the viewer's browser fetches it directly, vidsrc's servers never do. */
  subUrl?: string;
  subLabel?: string;
  subLang?: string;
}

/**
 * Build the iframe `src` for a title.
 *
 * Returns `''` when neither id is usable, which callers treat as "not
 * playable" rather than rendering an iframe that would 404.
 *
 * Note on `autoplay`: it is deliberately not exposed. On the default domains
 * vidsrc always shows its own play button first, so the parameter only
 * controls what happens after that click — passing it would imply a level of
 * control we do not have.
 */
export function buildEmbedUrl(opts: EmbedOptions): string {
  const { type, tmdbId, imdbId, season, episode, startAt, dsLang, autoNext, subUrl, subLabel, subLang } =
    opts;

  const id = tmdbId ? String(tmdbId) : imdbId || '';
  if (!id) return '';

  let path = `/embed/${type}/${id}`;
  if (type === 'tv' && season != null && episode != null) {
    path += `/${season}/${episode}`;
  }

  const params = new URLSearchParams();
  if (startAt && startAt > 0) params.set('startAt', String(Math.floor(startAt)));
  if (dsLang?.length) params.set('ds_lang', dsLang.slice(0, 3).join(','));
  if (autoNext) params.set('autonext', '1');
  if (subUrl) {
    params.set('sub_url', subUrl);
    if (subLabel) params.set('sub_label', subLabel);
    if (subLang) params.set('sub_lang', subLang);
  }

  const query = params.toString();
  return `${VIDSRC_DOMAIN}${path}${query ? `?${query}` : ''}`;
}

/**
 * The origin every `postMessage` from the player must come from.
 *
 * The embed page relays messages up from two nested frames on other domains,
 * but the frame WE own a handle to is on this origin, so this is what
 * `event.origin` will read. Anything else is another page on the site (or an
 * attacker) and must be ignored.
 */
export function vidsrcOrigin(): string {
  try {
    return new URL(VIDSRC_DOMAIN).origin;
  } catch {
    return 'https://vidsrc.sh';
  }
}

/**
 * Subtitle language preference for a locale.
 *
 * Vietnamese first for `vi`, then English as the near-universal fallback —
 * vidsrc's coverage of Vietnamese subtitles is best-effort, so a viewer on
 * the Vietnamese site is better served by English subtitles than by none.
 */
export function subtitleLanguagesFor(locale: string | undefined): string[] {
  return locale === 'vi' ? ['vi', 'en'] : ['en'];
}

// ============================================================================
// LATEST FEEDS
// ============================================================================

export interface VidsrcLatestMovie {
  imdb_id: string;
  tmdb_id: string | null;
  title: string;
  embed_url: string;
  embed_url_tmdb?: string;
  quality?: string;
  time_added?: string;
}

export interface VidsrcLatestEpisode extends Omit<VidsrcLatestMovie, 'title'> {
  show_title: string;
  season: string;
  episode: string;
}

export type VidsrcLatestKind = 'movies' | 'tvshows' | 'episodes';

interface VidsrcFeedResponse<T> {
  result: T[];
  pages: number;
}

/**
 * One page of vidsrc's "recently added" feed, 50 items per page.
 *
 * The published docs suggest these feeds walk the entire catalogue
 * (`"pages": 1833` in their example). They do not: every feed reports
 * `pages: 5` and page 6 returns an empty array, so the reachable window is
 * the newest 250 items. Treat this as a "what's new" rail, never as a
 * catalog source — that job belongs to TMDB, with `/ids/*.txt` deciding what
 * is playable.
 */
export async function getLatest<T = VidsrcLatestMovie>(
  kind: VidsrcLatestKind,
  page = 1
): Promise<T[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${VIDSRC_DOMAIN}/${kind}/latest/page-${page}.json`, {
      signal: controller.signal,
      next: { revalidate: 60 * 10 }, // feed is edge-cached ~5 min upstream
    });
    if (!res.ok) return [];
    const json = (await res.json()) as VidsrcFeedResponse<T>;
    return Array.isArray(json?.result) ? json.result : [];
  } catch {
    // The "what's new" rail is decorative — an outage hides it, nothing more.
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================================
// ID LISTS  (source of truth for the availability index)
// ============================================================================

export type VidsrcIdList =
  | 'movie_tmdb'
  | 'movie_imdb'
  | 'tv_tmdb'
  | 'tv_imdb'
  | 'eps_tmdb'
  | 'eps_imdb';

/**
 * Stream one of the daily id dumps as an array of lines.
 *
 * These are large — ~95k movie ids, ~20k TV ids, ~508k episode ids as of
 * 2026-09-20 — so this is for the sync cron only. Nothing in a request path
 * should ever call it.
 */
export async function fetchIdList(list: VidsrcIdList): Promise<string[]> {
  const res = await fetch(`${VIDSRC_DOMAIN}/ids/${list}.txt`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`vidsrc id list ${list} responded ${res.status}`);
  }
  const text = await res.text();
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}
