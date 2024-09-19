'use server';

import NewlyMovie from 'types/newly-movie';
import MovieServices from 'services/movie-services';

export async function getDescriptionHeroSectionMovies(movies: NewlyMovie[]) {
  const fetcher = movies.map((movie: NewlyMovie) => {
    return MovieServices.getDetailMovie(movie.slug);
  });

  const detailMovies = await Promise.all(fetcher);

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
  const res = await MovieServices.getMoviesCountry(slug, page);
  return res.data.items;
}

export async function searchingMovie(slug: string) {
  const res = await MovieServices.searchMovie(slug);
  return res;
}
