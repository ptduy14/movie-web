'use client';
import { searchingMovie } from 'app/actions';
import { useEffect, useState } from 'react';
import Movie from 'types/movie';
import { isNotNull } from 'utils/movie-utils';
import RegularMovieItem from '../commons/regular-movie-item';
import LoadingSpinner from '../loading/loading-spinner';
import SearchInput from './search-input';
import SearchDiscovery, { type SearchSuggestion } from './search-discovery';
import { analytics } from 'lib/posthog/events';

export default function SearchMoviePage({
  movieName,
  suggestions,
}: {
  movieName: string;
  suggestions: SearchSuggestion[];
}) {
  const [movies, setMovies] = useState<Movie[]>([]);
  // Seed the spinner true when arriving with a query in the URL so we don't
  // flash the "no results" state before the first fetch resolves.
  const [isFetching, setIsFetching] = useState<boolean>(isNotNull(movieName));

  const hasQuery = isNotNull(movieName);

  useEffect(() => {
    const fetchData = async () => {
      if (isNotNull(movieName)) {
        setIsFetching(true);
        const res = await searchingMovie(movieName);
        const items = res.data.items;
        setMovies(items);
        setIsFetching(false);
        analytics.searchPerformed(movieName, items?.length ?? 0);
      } else {
        setMovies([]);
        setIsFetching(false);
      }
    };
    fetchData();
  }, [movieName]);

  return (
    <div className="pt-20 lg:pt-32 container-wrapper-movie h-full px-4 lg:px-0">
      {/* Search Input Section */}
      <div className="w-full h-12 lg:h-12 mb-6 lg:mb-0">
        <SearchInput />
      </div>

      {/* Results Section */}
      {isFetching ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      ) : hasQuery && movies.length !== 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6 mt-8 lg:mt-14">
          {movies.map((movie: Movie, index: number) => (
            <RegularMovieItem movie={movie} key={index} />
          ))}
        </div>
      ) : (
        <SearchDiscovery query={hasQuery ? movieName : undefined} suggestions={suggestions} />
      )}
    </div>
  );
}
