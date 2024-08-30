'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import NewlyMovieItem from './newly-movie-item';
import NewlyMovie from 'types/newly-movie';
import Movie from 'types/movie';
import RegularMovieItem from './regular-movie-item';

interface MovieListProps {
  listName: string;
  movies: NewlyMovie[] | Movie[];
  isNewlyMovieItem: boolean;
}

export default function MovieList({ listName, movies, isNewlyMovieItem }: MovieListProps) {
  return (
    <div className="container-wrapper space-y-4">
      <h2 className="text-2xl font-semibold">{listName}</h2>
      <Swiper slidesPerView={5} spaceBetween={30} loop={true} className="mySwiper">
        {isNewlyMovieItem
          ? movies.map((movie) => (
              <SwiperSlide key={movie._id}>
                <NewlyMovieItem movie={movie as NewlyMovie} />
              </SwiperSlide>
            ))
          : movies.map((movie) => (
              <SwiperSlide key={movie._id}>
                <RegularMovieItem movie={movie as Movie} />
              </SwiperSlide>
            ))}
      </Swiper>
    </div>
  );
}
