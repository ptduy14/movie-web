import type { Locale } from 'i18n/routing';
import type Tmdb from 'types/tmdb';
import type { TmdbLogo } from 'types/tmdb-logo';
import TMDBServices from 'services/tmdb-services';
import { getCachedLogos, setCachedLogos, getCachedPosters, setCachedPosters } from 'services/tmdb-images-cache';

const TMDB_LOGO_BASE = `${process.env.NEXT_PUBLIC_TMDB_IMG_DOMAIN}/t/p/w500`;

/**
 * Treat empty string and "xx" as "no language" alongside null — TMDB is
 * inconsistent about how textless logos are tagged.
 */
const isLangless = (lang: string | null | undefined): boolean =>
  lang == null || lang === '' || lang === 'xx';

/**
 * File paths of brand-placeholder logos that TMDB community users upload
 * across many titles when no real title logo is available. The same file
 * (identified by file_path) is reused across hundreds of titles, so a single
 * entry blocks every instance.
 *
 * Extend as new cases surface. Observed cases live in the comment after each
 * entry so future maintainers know what they're looking at.
 */
const BRAND_PLACEHOLDER_FILE_PATHS = new Set<string>([
  '/2SaqA8OM0mTlXcsYLJ8JtcqPUce.png', // Netflix wordmark — first seen on "Untold UK: Jamie Vardy" (tmdb 1684240); reused across most Netflix Originals on TMDB
]);

/**
 * Logo must be at least this wide / tall to be considered usable. Below this
 * threshold the upload is typically a low-resolution placeholder or a thin
 * sub-banner that won't scale up cleanly to hero/detail page sizes.
 */
const MIN_LOGO_WIDTH = 300;
const MIN_LOGO_HEIGHT = 60;

/**
 * Minimum TMDB community rating to trust a *voted* logo. Tuned against the
 * Netflix-wordmark case (vote_average 0.166, vote_count 1) and verified to
 * preserve real title logos in the 3-9 range. Floor only triggers when the
 * community has actually voted — unvoted logos (vote_count === 0) get the
 * benefit of the doubt since there's no signal yet.
 */
const LOGO_QUALITY_FLOOR = 1;

const isAcceptableLogo = (logo: TmdbLogo): boolean => {
  if (BRAND_PLACEHOLDER_FILE_PATHS.has(logo.file_path)) return false;
  if (logo.width < MIN_LOGO_WIDTH || logo.height < MIN_LOGO_HEIGHT) return false;
  if (logo.vote_count >= 1 && logo.vote_average < LOGO_QUALITY_FLOOR) return false;
  return true;
};

/**
 * Pick the best logo URL for the active locale, or `null` if none qualify.
 *
 * Strict-by-locale strategy (decided 2026-05-13): for `vi` we accept
 * `vi → en → langless`; for `en` we accept `en → langless`. We do NOT fall
 * back to arbitrary languages, to avoid surprising users with a Korean or
 * Japanese logo on a Vietnamese UI.
 *
 * Within each accepted language bucket, pick the highest `vote_average`
 * (TMDB community curation).
 */
export function pickLogoUrl(logos: TmdbLogo[] | undefined, locale: Locale): string | null {
  if (!logos || logos.length === 0) return null;

  // Sentinel `null` here means "match logos with no language tag"
  const priority: (string | null)[] = locale === 'vi' ? ['vi', 'en', null] : ['en', null];

  for (const lang of priority) {
    const group = logos
      .filter((l) => (lang === null ? isLangless(l.iso_639_1) : l.iso_639_1 === lang))
      .filter(isAcceptableLogo);
    if (group.length === 0) continue;
    const best = [...group].sort((a, b) => b.vote_average - a.vote_average)[0];
    return `${TMDB_LOGO_BASE}${best.file_path}`;
  }
  return null;
}

const TMDB_POSTER_BASE = `${process.env.NEXT_PUBLIC_TMDB_IMG_DOMAIN}/t/p/w500`;

/**
 * Resolve the best TMDB portrait poster URL for a title, with Upstash cache
 * (same pattern as fetchMovieLogoUrl — 7-day TTL, raw array stored so picker
 * logic can change without a cache flush).
 *
 * Picker strategy: en > any language, sorted by vote_average within each group.
 */
export async function fetchMoviePosterUrl(
  tmdb: Pick<Tmdb, 'id' | 'type'> | undefined
): Promise<string | null> {
  if (!tmdb?.id || !tmdb?.type) return null;
  try {
    let posters = await getCachedPosters(tmdb.type, tmdb.id);
    if (posters === undefined) {
      const res = await TMDBServices.getImages(tmdb.id, tmdb.type);
      posters = res.posters ?? [];
      await setCachedPosters(tmdb.type, tmdb.id, posters);
    }
    if (posters.length === 0) return null;
    const sorted = [...posters].sort((a, b) => {
      const aEn = a.iso_639_1 === 'en' ? 1 : 0;
      const bEn = b.iso_639_1 === 'en' ? 1 : 0;
      if (aEn !== bEn) return bEn - aEn;
      return b.vote_average - a.vote_average;
    });
    return `${TMDB_POSTER_BASE}${sorted[0].file_path}`;
  } catch {
    return null;
  }
}

/**
 * Resolve the best TMDB logo URL for a title, with an Upstash cache layer in
 * front of the TMDB images endpoint.
 *
 * Flow:
 *  1. Cache hit  → run picker against cached logos and return.
 *  2. Cache miss → fetch TMDB → write logos array to cache (7-day TTL) → run
 *                  picker → return.
 *
 * The cache stores the raw `logos` array (locale-agnostic) rather than the
 * resolved URL so that picker logic changes — new denylist entries, threshold
 * tweaks, locale-strict rule changes — take effect immediately without
 * waiting for TTL expiry. Empty arrays are cached too so titles without
 * logos don't burn a TMDB call on every render.
 *
 * Returns `null` when:
 *  - the movie has no TMDB id (skip entirely),
 *  - the TMDB request fails AND there is no cache entry,
 *  - or the picker rejects every available logo for this locale.
 *
 * Never throws — callers can safely use the result as an optional prop.
 */
export async function fetchMovieLogoUrl(
  tmdb: Tmdb | undefined,
  locale: Locale
): Promise<string | null> {
  if (!tmdb?.id || !tmdb?.type) return null;

  try {
    let logos = await getCachedLogos(tmdb.type, tmdb.id);
    if (logos === undefined) {
      const res = await TMDBServices.getImages(tmdb.id, tmdb.type);
      logos = res.logos ?? [];
      // Awaited (not fire-and-forget) because Vercel serverless functions can
      // terminate before in-flight promises resolve, silently dropping the
      // write. `setCachedLogos` swallows its own errors, so the await is
      // bounded by Upstash latency (~20-50ms) and won't throw.
      await setCachedLogos(tmdb.type, tmdb.id, logos);
    }
    return pickLogoUrl(logos, locale);
  } catch {
    return null;
  }
}
