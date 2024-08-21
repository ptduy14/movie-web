"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import NewlyMovieItem from "./newly-movie-item";
import NewlyMovie from "types/newly-movie";

interface MovieListProps {
  listName: string;
  movies: NewlyMovie[];
}

export default function MovieList({ listName, movies }: MovieListProps) {
  return (
    <div className="container-wrapper space-y-4">
      <h2 className="text-xl font-semibold">{listName}</h2>
      <Swiper
        slidesPerView={5}
        spaceBetween={30}
        loop={true}
        className="mySwiper"
      >
        {movies.map((movie) => (
          <SwiperSlide key={movie._id}>
            <NewlyMovieItem movie={movie}/>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
