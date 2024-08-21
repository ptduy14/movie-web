"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { EffectFade, Autoplay } from "swiper/modules";
import NewlyMovie from "types/newly-movie";
import HeroMovieItem from "../commons/hero-movie-item";
import { useRef } from "react";

interface HeroSectionProps {
  movies: NewlyMovie[];
  detailMovies: any;
}

export default function HeroSection({ movies, detailMovies }: HeroSectionProps) {
  const swiperRef = useRef<any>(null);
  const handleClickToNextSlide = () => {
    swiperRef.current?.slideNext();
  }

  return (
    <Swiper
      modules={[EffectFade, Autoplay]}
      effect="fade"
      autoplay={{ delay: 4000 }}
      loop={true}
      onSwiper={(swiper) => (swiperRef.current = swiper)}
    >
      {movies.map((movie, index) => (
        <SwiperSlide
          key={movie._id}
          onClick={handleClickToNextSlide}
        >
          <HeroMovieItem movie={movie} movieContent={detailMovies[index].movie.content}/>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
