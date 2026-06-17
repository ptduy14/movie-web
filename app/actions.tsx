'use server';

import NewlyMovie from 'types/newly-movie';
import MovieServices, { type MovieFilters } from 'services/movie-services';
import { redirect } from 'i18n/routing';
import { getLocale } from 'next-intl/server';
import { localizeMovieContentsBatch } from 'services/movie-content-localizer';
import { fetchMovieLogoUrl } from 'utils/tmdb-logo';
import type { Locale } from 'i18n/routing';

export async function getDetailMovieServerAction(movies: NewlyMovie[]) {
  const locale = await getLocale();
  const fetcher = movies.map((movie: NewlyMovie) => {
    return MovieServices.getDetailMovie(movie.slug);
  });

  const detailMovies = await Promise.all(fetcher);

  // Batched localization: 1 Groq call for ALL cache-miss movies in this set
  // instead of N parallel calls (saves free-tier RPM quota).
  // No-op when locale === 'vi'.
  const items = detailMovies
    .filter((d: any) => d?.movie?.content)
    .map((d: any) => ({
      movieId: d.movie._id,
      content: d.movie.content,
      sourceModifiedAt: d.movie.modified?.time ?? null,
    }));

  const localizedMap = await localizeMovieContentsBatch(items, locale);

  detailMovies.forEach((detail: any) => {
    if (detail?.movie?.content) {
      const localized = localizedMap.get(detail.movie._id);
      if (localized) detail.movie.content = localized;
    }
  });

  return detailMovies;
}

/**
 * Resolve TMDB logo URLs for a batch of hero movies, keyed by movie slug.
 *
 * Each movie triggers one TMDB images request, fired in parallel. Missing or
 * failed lookups map to `null` so the component falls back to text. With Next
 * data cache disabled, this is a fresh fan-out per hero render — keep an eye
 * on Vercel function duration if the hero slide count grows.
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

export async function getMoviesByFormat(slug: string, page: number, filters?: MovieFilters) {
  const res = await MovieServices.getMoviesFormat(slug, page, filters);
  return { items: res.data.items, totalItems: res.data.params?.pagination?.totalItems ?? null };
}

export async function getMoviesByType(slug: string, page: number, filters?: MovieFilters) {
  const res = await MovieServices.getMoviesType(slug, page, filters);
  return { items: res.data.items, totalItems: res.data.params?.pagination?.totalItems ?? null };
}

export async function getMoviesByCountry(slug: string, page: number, filters?: MovieFilters) {
  try {
    const res = await MovieServices.getMoviesCountry(slug, page, filters);

    if (res.status === 'error') throw new Error('');

    return { items: res.data.items, totalItems: res.data.params?.pagination?.totalItems ?? null };
  } catch (error) {
    const locale = await getLocale();
    redirect({ href: '/', locale });
  }
}

export async function searchingMovie(slug: string) {
  const res = await MovieServices.searchMovie(slug);
  return res;
}

/**
 * "Because you watched" — given a watched movie's slug, resolve its first
 * genre (from the detail endpoint, since recent-movie records don't store
 * category) and return same-genre titles. Best-effort: any failure or a
 * categoryless movie yields an empty list so the rail hides.
 */
export async function getBecauseYouWatched(slug: string) {
  try {
    const detail = await MovieServices.getDetailMovie(slug);
    const category = detail?.movie?.category?.[0];
    if (!category?.slug) return [];
    const res = await MovieServices.getMoviesType(category.slug, 1);
    return res?.data?.items ?? [];
  } catch {
    return [];
  }
}
