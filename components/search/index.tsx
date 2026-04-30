'use client';
import { searchingMovie } from 'app/actions';
import { useEffect, useState } from 'react';
import Movie from 'types/movie';
import { isNotNull } from 'utils/movie-utils';
import { useDebounce } from '../hooks/useDebounce';
import RegularMovieItem from '../commons/regular-movie-item';
import LoadingSpinner from '../loading/loading-spinner';
import BrandingPlaceholder from './branding-placeholder';
import SearchInput from './search-input';

export default function SearchMoviePage({ movieName }: { movieName: string }) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      if (isNotNull(movieName)) {
        setIsFetching(true);
        const res = await searchingMovie(movieName);
        setMovies(res.data.items);
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
      ) : movies.length !== 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6 mt-8 lg:mt-14">
          {movies.map((movie: Movie, index: number) => (
            <RegularMovieItem movie={movie} key={index} />
          ))}
        </div>
      ) : (
        <BrandingPlaceholder />
      )}
    </div>
  );
}
