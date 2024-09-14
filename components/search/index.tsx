'use client';
import { searchingMovie } from 'app/actions';
import { useEffect, useState } from 'react';
import Movie from 'types/movie';
import { isNotNull } from 'utils/isHaveEpisodesMovie';
import { useDebounce } from '../hooks/useDebounce';
import RegularMovieItem from '../commons/regular-movie-item';
import LoadingComponent from '../loading/loading-component';
import BrandingPlaceholder from './branding-placeholder';

export default function SearchMoviePage() {
  const [value, setValue] = useState<string>('');
  const valueSearching = useDebounce(value);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      if (isNotNull(value)) {
        setIsFetching(true);
        const res = await searchingMovie(value);
        setMovies(res.data.items);
        setIsFetching(false);
      }
    };

    fetchData();
  }, [valueSearching]);

  return (
    <div className="pt-32 container-wrapper-movie h-full">
      <div className="w-full h-12">
        <input
          type="text"
          className="w-full h-full text-black px-3 text-lg"
          placeholder="Nhập tên phim..."
          onChange={(e) => setValue(e.target.value)}
          value={value}
        />
      </div>
      {isFetching ? (
        <LoadingComponent />
      ) : (
        movies.length !== 0 ? 
        <div className="grid grid-cols-5 gap-6 mt-14">
          {movies.map((movie: Movie, index: number) => (
            <RegularMovieItem movie={movie} key={index} />
          ))}
        </div> : <BrandingPlaceholder />
      )}
    </div>
  );
}
