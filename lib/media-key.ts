/**
 * Identity for a catalog title: how a TMDB media type + id becomes a URL
 * slug, a storage key, and back again.
 *
 * Why this exists
 * ---------------
 * TMDB numbers movies and TV shows in SEPARATE sequences — movie 1399 and
 * tv 1399 are different titles. Any key that carries only the number is
 * ambiguous, and an ambiguous key in Firestore or localStorage silently
 * mixes two titles' watch progress. So every key here carries the media type.
 *
 * Two shapes, one source of truth:
 *   - `mediaId('tv', 1399)`   → `"tv-1399"`        — storage / React keys
 *   - `buildSlug(...)`        → `"game-of-thrones-tv-1399"` — URLs
 *
 * The slug's human part is decorative: `parseSlug` reads only the trailing
 * `-<type>-<id>`, so a renamed title still resolves from an old bookmark.
 */

import type { MediaType } from 'constants/tmdb-taxonomy';

/** Canonical storage / React key for a title. Stable forever. */
export function mediaId(type: MediaType, id: string | number): string {
  return `${type}-${id}`;
}

/** Inverse of `mediaId`. Returns null for anything that isn't one. */
export function parseMediaId(value: string | undefined | null): MediaRef | null {
  if (!value) return null;
  const match = /^(movie|tv)-(\d+)$/.exec(value);
  if (!match) return null;
  return { type: match[1] as MediaType, id: match[2] };
}

export interface MediaRef {
  type: MediaType;
  id: string;
}

/**
 * Strip Vietnamese diacritics and punctuation down to a URL-safe slug body.
 *
 * `normalize('NFD')` splits base letters from their combining marks so a
 * single range delete handles every accent; `đ`/`Đ` need their own rule
 * because they are distinct letters, not accented `d`.
 */
export function slugifyTitle(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Build the public URL slug for a title.
 *
 * Falls back to a bare `<type>-<id>` slug when the title slugifies to nothing
 * (titles written entirely in non-Latin scripts, e.g. `ハウルの動く城`), which
 * keeps the URL resolvable instead of producing `--tv-1399`.
 */
export function buildSlug(type: MediaType, id: string | number, title: string): string {
  const body = slugifyTitle(title ?? '');
  const tail = mediaId(type, id);
  return body ? `${body}-${tail}` : tail;
}

/**
 * Read the media type + id back out of a URL slug.
 *
 * Tolerates a bare `movie-550` (no title part) and ignores whatever precedes
 * the final `-<type>-<id>` pair, so title changes never break old links.
 * Returns null when the slug has no recognizable tail — callers treat that
 * as a 404 rather than guessing.
 */
export function parseSlug(slug: string | undefined | null): MediaRef | null {
  if (!slug) return null;
  const match = /(?:^|-)(movie|tv)-(\d+)$/.exec(slug);
  if (!match) return null;
  return { type: match[1] as MediaType, id: match[2] };
}
