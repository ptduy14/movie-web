'use server';

import NewlyMovie from 'types/newly-movie';
import MovieServices from 'services/movie-services';
import { redirect } from 'i18n/routing';
import { getLocale } from 'next-intl/server';
import { localizeMovieContentsBatch } from 'services/movie-content-localizer';

export async function getDetailMovieServerAction(movies: NewlyMovie[]) {
  const locale = await getLocale();
  const fetcher = movies.map((movie: NewlyMovie) => {
    return MovieServices.getDetailMovie(movie.slug);
  });

  const detailMovies = await Promise.all(fetcher);

  // Batched localization: 1 Gemini call for ALL cache-miss movies in this set
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

export async function getMoviesByFormat(slug: string, page: number) {
  const res = await MovieServices.getMoviesFormat(slug, page);
  return res.data.items;
}

export async function getMoviesByType(slug: string, page: number) {
  const res = await MovieServices.getMoviesType(slug, page);
  return res.data.items;
}

export async function getMoviesByCountry(slug: string, page: number) {
  try {
    const res = await MovieServices.getMoviesCountry(slug, page);
    
    if (res.status === 'error') throw new Error("");
  
    return res.data.items;
  } catch (error) {
    const locale = await getLocale();
    redirect({ href: '/', locale });
  }
  
}

export async function searchingMovie(slug: string) {
  const res = await MovieServices.searchMovie(slug);
  return res;
}
