'use server';

import NewlyMovie from 'types/newly-movie';
import DetailMovie from 'types/detail-movie';
import { getLocale } from 'next-intl/server';
import { localizeMovieContentsBatch } from 'services/movie-content-localizer';
import { fetchMovieLogoUrl } from 'utils/tmdb-logo';
import type { Locale } from 'i18n/routing';
import {
  browseByFormat,
  browseByGenre,
  browseByCountry,
  searchTitles,
  getTitleDetail,
  getBecauseYouWatchedTitles,
  type CatalogPage,
} from 'services/catalog-service';
import type { MovieFilters } from 'types/movie-filters';

export type { MovieFilters, CatalogPage };

/**
 * Resolve full detail for a small set of list items — the hero carousel,
 * which needs synopses the list endpoints don't carry.
 *
 * Failures are dropped rather than thrown: a hero with four slides is fine,
 * a home page that 500s because one title 404'd is not.
 */
export async function getDetailMovieServerAction(movies: NewlyMovie[]): Promise<DetailMovie[]> {
  const locale = await getLocale();

  const settled = await Promise.allSettled(
    movies.map((movie) => getTitleDetail(movie.slug, locale))
  );

  const detailMovies = settled
    .filter(
      (r): r is PromiseFulfilledResult<DetailMovie> =>
        r.status === 'fulfilled' && r.value !== null
    )
    .map((r) => r.value);

  // One batched translation call for every title still missing a synopsis in
  // this locale, instead of one call per title.
  const items = detailMovies
    .filter((d) => d.movie.content)
    .map((d) => ({ movieId: d.movie._id, content: d.movie.content }));

  const localizedMap = await localizeMovieContentsBatch(items, locale);

  detailMovies.forEach((detail) => {
    const localized = localizedMap.get(detail.movie._id);
    if (localized) detail.movie.content = localized;
  });

  return detailMovies;
}

/**
 * Resolve TMDB logo URLs for a batch of hero movies, keyed by movie slug.
 *
 * Each movie triggers one TMDB images request, fired in parallel and served
 * from the Upstash cache on repeat views. Missing or failed lookups map to
 * `null` so the component falls back to text.
 */
export async function getHeroLogoUrlsServerAction(
  movies: NewlyMovie[]
): Promise<Record<string, string | null>> {
  const locale = (await getLocale()) as Locale;
  const urls = await Promise.all(movies.map((m) => fetchMovieLogoUrl(m.tmdb, locale)));
  const map: Record<string, string | null> = {};
  movies.forEach((m, i) => {
    map[m.slug] = urls[i];
  });
  return map;
}

export async function getMoviesByFormat(
  slug: string,
  page: number,
  filters?: MovieFilters
): Promise<CatalogPage> {
  const locale = await getLocale();
  return browseByFormat(slug, page, filters, locale);
}

export async function getMoviesByType(
  slug: string,
  page: number,
  filters?: MovieFilters
): Promise<CatalogPage> {
  const locale = await getLocale();
  return browseByGenre(slug, page, filters, locale);
}

export async function getMoviesByCountry(
  slug: string,
  page: number,
  filters?: MovieFilters
): Promise<CatalogPage> {
  const locale = await getLocale();
  return browseByCountry(slug, page, filters, locale);
}

export async function searchingMovie(query: string): Promise<CatalogPage> {
  const locale = await getLocale();
  return searchTitles(query, locale);
}

/**
 * "Because you watched" — same-genre titles for a slug taken from watch
 * history. Best-effort; an empty array hides the rail.
 */
export async function getBecauseYouWatched(slug: string): Promise<NewlyMovie[]> {
  const locale = await getLocale();
  return getBecauseYouWatchedTitles(slug, locale);
}
