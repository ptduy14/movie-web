import type { Locale } from 'i18n/routing';
import type Tmdb from 'types/tmdb';
import type { TmdbLogo } from 'types/tmdb-logo';
import TMDBServices from 'services/tmdb-services';

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

/**
 * Fetch images from TMDB and apply `pickLogoUrl` in one call.
 *
 * Returns `null` when:
 *  - the movie has no TMDB id,
 *  - the TMDB request fails,
 *  - or no logo matches the locale-strict fallback chain.
 *
 * Never throws — callers can safely use the result as an optional prop.
 */
export async function fetchMovieLogoUrl(
  tmdb: Tmdb | undefined,
  locale: Locale
): Promise<string | null> {
  if (!tmdb?.id || !tmdb?.type) return null;
  try {
    const res = await TMDBServices.getImages(tmdb.id, tmdb.type);
    return pickLogoUrl(res.logos, locale);
  } catch {
    return null;
  }
}
