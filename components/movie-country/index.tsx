'use client';

import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import Movie from 'types/movie';
import RegularMovieItem from '../commons/regular-movie-item';
import { getMoviesByCountry } from 'app/actions';
import { useInfinitePagination } from 'hooks/useInfinitePagination';
import { MovieGridLoadMoreSkeleton } from '../commons/movie-grid-skeleton';
import InfiniteScrollSentinel from '../commons/infinite-scroll-sentinel';
import MovieFilterBar, { parseSort } from '../commons/movie-filter-bar';
import { localizedCountry } from 'constants/i18n-mappings';
import type { Locale } from 'i18n/routing';
import type { MovieFilters } from 'services/movie-services';

export default function MovieCountryPage({ slug }: { slug: string }) {
  const locale = useLocale() as Locale;
  const searchParams = useSearchParams();
  const category = searchParams.get('category') ?? '';
  const year = searchParams.get('year') ?? '';
  const sort = searchParams.get('sort') ?? '';

  const fetcher = useCallback(
    (page: number) => {
      const filters: MovieFilters = {
        category: category || undefined,
        year: year || undefined,
        ...parseSort(sort),
      };
      return getMoviesByCountry(slug, page, filters) as Promise<{
        items: Movie[];
        totalItems: number | null;
      }>;
    },
    [slug, category, year, sort]
  );

  const { items: movies, totalItems, isLoading, isLoadingMore, hasMore, error, sentinelRef, retry } =
    useInfinitePagination<Movie>({ fetcher, resetKey: `${slug}|${category}|${year}|${sort}` });

  return (
    <div className="pt-[3.75rem]">
      <div className="container-wrapper px-4 sm:px-6 md:px-8 lg:px-0">
        <MovieFilterBar
          title={localizedCountry(slug, locale)}
          dimensions={['category', 'year']}
          count={totalItems}
        />
      </div>

      {isLoading ? (
        <MovieGridLoadMoreSkeleton count={20} />
      ) : (
        <div className="mt-6 lg:mt-8">
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
      )}
    </div>
  );
}
