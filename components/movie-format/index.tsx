'use client';

import { useEffect, useState, useCallback } from 'react';
import Movie from 'types/movie';
import RegularMovieItem from '../commons/regular-movie-item';
import { getMoviesByFormat } from 'app/actions';
import LoadingComponent from '../loading/loading-component';
import { useInView } from 'react-intersection-observer';

export default function MovieFormatPage({ slug }: { slug: string }) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [inViewRef, inView] = useInView();
  const [page, setPage] = useState<number>(1);

  const getMovies = useCallback(async () => {
    const data = await getMoviesByFormat(slug, page);
    setMovies((prev) => [...prev, ...data]);
    isLoading && setIsLoading(false);
  }, [slug, page, isLoading]);

  useEffect(() => {
    getMovies();
  }, [getMovies]);

  useEffect(() => {
    if (inView) {
      setPage((prev) => prev + 1);
    }
  }, [inView]);

  useEffect(() => {
    if (page > 1) getMovies();
  }, [page, getMovies]);

  if (isLoading) return <LoadingComponent />;

  return (
    <div className="pt-[3.75rem]">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6 container-wrapper px-4 sm:px-6 md:px-8 lg:px-0">
        {movies.map((movie: Movie, index: number) => (
          <RegularMovieItem movie={movie} key={index} />
        ))}
      </div>
      <div ref={inViewRef} className="flex items-end justify-center h-12 w-full">
        <div
          className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
          role="status"
        >
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>
      </div>
    </div>
  );
}
