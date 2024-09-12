'use client';
import { searchingMovie } from 'app/actions';
import { useEffect, useState } from 'react';
import Movie from 'types/movie';
import { isNotNull } from 'utils/isHaveEpisodesMovie';
import { useDebounce } from '../hooks/useDebounce';
import RegularMovieItem from '../commons/regular-movie-item';
import LoadingPage from '../loaders/loading-page';

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
    <div className="pt-32 h-screen container-wrapper-movie space-y-14">
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
        <div className="flex items-center justify-center h-full w-full">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
            role="status"
          >
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              Loading...
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-6 container-wrapper">
          {movies.map((movie: Movie, index: number) => (
            <RegularMovieItem movie={movie} key={index} />
          ))}
        </div>
      )}
    </div>
  );
}
