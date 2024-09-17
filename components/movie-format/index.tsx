'use client';

import { useEffect, useState } from 'react';
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

  const getMovies = async () => {
    const data = await getMoviesByFormat(slug, page);
    setMovies((prev) => [...prev, ...data]);
    isLoading && setIsLoading(false);
  };

  useEffect(() => {
    getMovies();
  }, []);

  useEffect(() => {
    if (inView) {
      setPage((prev) => prev + 1);
    }
  }, [inView]);

  useEffect(() => {
    if (page > 1) getMovies();
  }, [page]);

  if (isLoading) return <LoadingComponent />;

  return (
    <div className="pt-[3.75rem]">
      <div className="grid grid-cols-5 gap-6 container-wrapper">
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
