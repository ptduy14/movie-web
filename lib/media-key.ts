/**
 * Reading v2.0.0 title slugs.
 *
 * v2 addressed titles by TMDB id — `game-of-thrones-tv-1399`,
 * `nguoi-sat-3-movie-68721` — and those URLs live on in bookmarks, search
 * engines and watch history. v3 addresses titles by catalog slug; the catalog
 * resolves an old slug through its TMDB id (`getTitleDetail`) and the page
 * redirects to the new URL.
 *
 * Only the read side survives: nothing builds these slugs any more.
 */

import type { MediaType } from 'constants/tmdb-taxonomy';

export interface MediaRef {
  type: MediaType;
  id: string;
}

/**
 * Read the media type + id back out of a v2 slug.
 *
 * Tolerates a bare `movie-550` (no title part) and ignores whatever precedes
 * the final `-<type>-<id>`. Returns null when there is no such tail — which
 * is every v3 slug, so callers try the catalog first and this second.
 */
export function parseSlug(slug: string | undefined | null): MediaRef | null {
  if (!slug) return null;
  const match = /(?:^|-)(movie|tv)-(\d+)$/.exec(slug);
  if (!match) return null;
  return { type: match[1] as MediaType, id: match[2] };
}
