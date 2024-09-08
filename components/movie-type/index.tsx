'use client';

import { useEffect, useState } from 'react';
import Movie from 'types/movie';
import RegularMovieItem from '../commons/regular-movie-item';
import { getMoviesByType } from 'app/actions';
import LoadingPage from '../loaders/loading-page';
import MovieTypeHero from './movie-type-hero';

export default function MovieTypePage({ slug }: { slug: string }) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(true);

  const getMovies = async () => {
    const data = await getMoviesByType(slug);
    setMovies((prev) => [...prev, ...data]);
  };

  useEffect(() => {
    getMovies();
  }, []);

  useEffect(() => {
    if (movies.length !== 0) {
      setIsLoadingPage(false);
    }
  }, [movies]);

  if (isLoadingPage) return <LoadingPage />;

  return (
    <div>
      <MovieTypeHero />
      <div className="grid grid-cols-5 gap-6 container-wrapper">
        {movies.map((movie: Movie, index: number) => (
          <RegularMovieItem movie={movie} key={index} />
        ))}
      </div>
    </div>
  );
}
