'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Autoplay } from 'swiper/modules';
import NewlyMovie from 'types/newly-movie';
import HeroMovieItem from '../commons/hero-movie-item';
import { useEffect, useRef, useState } from 'react';
import { getDetailMovieServerAction } from 'app/actions';
import DetailMovie from 'types/detail-movie';
import LoadingComponent from '../loading/loading-component';

export default function HeroSection({ movies }: { movies: NewlyMovie[] }) {
  const [detailMovies, setDetailMovies] = useState<DetailMovie[]>([]);
  const swiperRef = useRef<any>(null);
  const [isFetchingDetailMovie, setIsFetchingDetailMovie] = useState<boolean>(false);

  useEffect(() => {
    setIsFetchingDetailMovie(true);
    const getDescriptionMovies = async () => {
      const data = await getDetailMovieServerAction(movies);
      setDetailMovies(data);
    };

    setIsFetchingDetailMovie(false);
    getDescriptionMovies();
  }, [movies]);

  const handleClickToNextSlide = () => {
    // swiperRef.current?.slideNext();
  };

  if (isFetchingDetailMovie) return <div className='h-[50rem]'><LoadingComponent/></div>

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
