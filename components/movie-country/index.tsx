'use client';

import { useCallback } from 'react';
import Movie from 'types/movie';
import RegularMovieItem from '../commons/regular-movie-item';
import { getMoviesByCountry } from 'app/actions';
import { useInfinitePagination } from 'hooks/useInfinitePagination';
import MovieGridSkeleton from '../commons/movie-grid-skeleton';
import InfiniteScrollSentinel from '../commons/infinite-scroll-sentinel';

export default function MovieCountryPage({ slug }: { slug: string }) {
  const fetcher = useCallback(
    (page: number) => getMoviesByCountry(slug, page) as Promise<Movie[]>,
    [slug]
  );

  const {
    items: movies,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    sentinelRef,
    retry,
  } = useInfinitePagination<Movie>({ fetcher, resetKey: slug });

  if (isLoading) return <MovieGridSkeleton />;

  return (
    <div className="pt-[3.75rem]">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6 container-wrapper px-4 sm:px-6 md:px-8 lg:px-0">
        {movies.map((movie: Movie, index: number) => (
          <RegularMovieItem movie={movie} key={`${movie._id}-${index}`} />
        ))}
      </div>
      <InfiniteScrollSentinel
        sentinelRef={sentinelRef}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        error={error}
        onRetry={retry}
        isEmpty={movies.length === 0}
      />
    </div>
  );
}
