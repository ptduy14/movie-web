import type { MediaType } from 'constants/tmdb-taxonomy';

/**
 * vidsrc.sh — the BACKUP playback source.
 *
 * Since v3 the main player streams the catalog's own m3u8; vidsrc's iframe is
 * what the watch page falls back to when that stream can't be reached
 * (viewers outside Vietnam, a dead link). Only the embed URL is used now —
 * the "latest" feeds and daily id dumps that powered v2's availability
 * index are gone with it, because the catalog hosts a stream for every title it
 * lists.
 */

const VIDSRC_DOMAIN = (process.env.NEXT_PUBLIC_VIDSRC_DOMAIN || 'https://vidsrc.sh').replace(
  /\/+$/,
  ''
);

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
