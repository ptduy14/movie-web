'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Autoplay } from 'swiper/modules';
import NewlyMovie from 'types/newly-movie';
import HeroMovieItem from '../commons/hero-movie-item';
import { useEffect, useRef, useState } from 'react';
import { getDetailMovieServerAction } from 'app/actions';
import DetailMovie from 'types/detail-movie';
import LoadingComponent from '../loading/loading-component';
import { useHomePageLoadingContext } from '../context/home-page-loading-context';
import { FaChevronRight } from 'react-icons/fa6';

export default function HeroSection({ movies }: { movies: NewlyMovie[] }) {
  const [detailMovies, setDetailMovies] = useState<DetailMovie[]>([]);
  const swiperRef = useRef<any>(null);

  const { isLoadingHomePage, setISLoadingHomePage } = useHomePageLoadingContext();

  useEffect(() => {
    const getDescriptionMovies = async () => {
      const data = await getDetailMovieServerAction(movies);
      setDetailMovies(data);
      setISLoadingHomePage(false);
    };

    getDescriptionMovies();
  }, [movies]);

  const handleClickToNextSlide = () => {
    swiperRef.current?.slideNext();
  };

  if (isLoadingHomePage) {
    return <LoadingComponent />;
  }

  return (
    <div className='relative'>
      <Swiper
        modules={[EffectFade, Autoplay]}
        effect="fade"
        autoplay={{ delay: 10000 }}
        loop={true}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
      >
        {detailMovies.map((movie: DetailMovie) => {
          return (
            <SwiperSlide key={movie.movie._id}>
              <HeroMovieItem detailMovie={movie}/>
            </SwiperSlide>
          );
        })}
      </Swiper>
      <div className="absolute z-10 top-[18rem] right-6 border border-white p-4 rounded-full group hover:border-black hover:bg-white cursor-pointer transition-all duration-300" onClick={handleClickToNextSlide}>
        <FaChevronRight className="text-white group-hover:text-black transition-colors duration-300" />
      </div>
    </div>
  );
}
