/**
 * TMDB image URL construction.
 *
 * TMDB returns bare paths (`/o0dmWIrF63lBPQVFdvqaWUxQ7xz.jpg`); a usable URL
 * is `<base>/t/p/<size><path>`. The adapter emits ABSOLUTE urls so that
 * nothing downstream has to know which provider an image came from.
 *
 * `resolveImageUrl` exists for the render sites that used to prepend
 * `NEXT_PUBLIC_IMG_DOMAIN` to every path. Those sites now receive a mix:
 * absolute TMDB urls from the catalog, and absolute Google avatar urls from
 * Firestore-backed records. Passing an absolute url through untouched is the
 * whole point — prepending a base to an absolute url produced the classic
 * `https://host/https://host/...` breakage.
 */

const TMDB_BASE = process.env.NEXT_PUBLIC_TMDB_IMG_DOMAIN || 'https://image.tmdb.org';

/**
 * TMDB's published size buckets, narrowed to the ones this app renders.
 *
 * `w500` for portrait posters (cards, 2:3) and `w1280` for landscape
 * backdrops (hero, player poster). `original` is deliberately absent: every
 * image goes through `/api/image` for a sharp resize anyway, so fetching the
 * original would only burn bandwidth on the way in.
 */
export const TMDB_SIZES = {
  poster: 'w500',
  backdrop: 'w1280',
  still: 'w300',
  profile: 'w300',
} as const;

export type TmdbImageKind = keyof typeof TMDB_SIZES;

/**
 * Build an absolute TMDB image URL from a raw path.
 * Returns `''` for a null/empty path so callers can test truthiness rather
 * than rendering `undefined` into a `src` attribute.
 */
export function tmdbImageUrl(path: string | null | undefined, kind: TmdbImageKind): string {
  if (!path) return '';
  return `${TMDB_BASE}/t/p/${TMDB_SIZES[kind]}${path}`;
}

/**
 * Normalize whatever a record carries into something `<Image src>` accepts.
 *
 * - absolute http(s) url → unchanged
 * - protocol-relative `//host/...` → https
 * - anything else (a bare TMDB path, or a legacy relative path left over in
 *   Firestore) → treated as a TMDB path at the given size
 *
 * Empty input yields `''`, which callers gate on before rendering.
 */
export function resolveImageUrl(
  src: string | null | undefined,
  kind: TmdbImageKind = 'poster'
): string {
  if (!src) return '';
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('//')) return `https:${src}`;
  return tmdbImageUrl(src.startsWith('/') ? src : `/${src}`, kind);
}
