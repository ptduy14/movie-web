'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Autoplay } from 'swiper/modules';
import NewlyMovie from 'types/newly-movie';
import HeroMovieItem from '../commons/hero-movie-item';
import { useEffect, useRef, useState } from 'react';
import { getDescriptionHeroSectionMovies } from 'app/actions';
import DetailMovie from 'types/detail-movie';

export default function HeroSection({ movies }: { movies: NewlyMovie[] }) {
  const [detailMovies, setDetailMovies] = useState<DetailMovie[]>([]);
  const swiperRef = useRef<any>(null);

  useEffect(() => {
    const getDescriptionMovies = async () => {
      const data = await getDescriptionHeroSectionMovies(movies);
      setDetailMovies(data);

      // handleSetDescriptionMovies(data);
    };

    getDescriptionMovies();
  }, [movies]);

  // const handleSetDescriptionMovies = (detailMovies: any) => {
  //   detailMovies.forEach((item: any) => {
  //     setDiscriptionMovies([
  //       ...descriptionMovies,
  //       { _id: item.movie._id, description: item.movie.content },
  //     ]);
  //   });
  // };

  const handleClickToNextSlide = () => {
    // swiperRef.current?.slideNext();
  };

  return (
    <Swiper
      modules={[EffectFade, Autoplay]}
      effect="fade"
      autoplay={{ delay: 4000 }}
      loop={true}
      onSwiper={(swiper) => (swiperRef.current = swiper)}
    >
      {detailMovies.map((movie: DetailMovie) => {
        return <SwiperSlide key={movie.movie._id} onClick={handleClickToNextSlide}>
        <HeroMovieItem
          detailMovie={movie}
        />
      </SwiperSlide>
      })}
    </Swiper>
  );
}
