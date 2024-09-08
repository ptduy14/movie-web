'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Autoplay } from 'swiper/modules';
import NewlyMovie from 'types/newly-movie';
import HeroMovieItem from '../commons/hero-movie-item';
import { useEffect, useRef, useState } from 'react';
import { getDescriptionHeroSectionMovies } from 'app/actions';

interface DescriptionMovie {
  _id: string;
  description: string;
}

export default function HeroSection({ movies }: { movies: NewlyMovie[] }) {
  const [descriptionMovies, setDiscriptionMovies] = useState<DescriptionMovie[]>([]);
  const swiperRef = useRef<any>(null);

  useEffect(() => {
    const getDescriptionMovies = async () => {
      const data = await getDescriptionHeroSectionMovies(movies);

      handleSetDescriptionMovies(data);
    };

    getDescriptionMovies();
  }, [movies]);

  const handleSetDescriptionMovies = (detailMovies: any) => {
    detailMovies.forEach((item: any) => {
      setDiscriptionMovies([
        ...descriptionMovies,
        { _id: item.movie._id, description: item.movie.content },
      ]);
    });
  };

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
      {movies.map((movie: NewlyMovie) => {
        const movieContent = descriptionMovies.find((item) => item._id === movie._id);
        return (
          <SwiperSlide key={movie._id} onClick={handleClickToNextSlide}>
            <HeroMovieItem
              movie={movie}
              movieContent={movieContent?.description || 'Đang cập nhật nội dung phim'}
            />
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
}
