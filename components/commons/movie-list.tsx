'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import NewlyMovieItem from './newly-movie-item';
import NewlyMovie from 'types/newly-movie';
import Movie from 'types/movie';
import RegularMovieItem from './regular-movie-item';
import { GrNext } from 'react-icons/gr';
import { GrPrevious } from 'react-icons/gr';
import { useRef } from 'react';
import { useHomePageLoadingContext } from '../context/home-page-loading-context';

interface MovieListProps {
  listName: string;
  movies: NewlyMovie[] | Movie[];
  isNewlyMovieItem: boolean;
}

export default function MovieList({ listName, movies, isNewlyMovieItem }: MovieListProps) {
  const { isLoadingHomePage } = useHomePageLoadingContext();

  const swiperRef = useRef<any>(null);

  const handlePrevSlide = () => {
    swiperRef.current.slidePrev();
  };

  const handleNextSlide = () => {
    swiperRef.current.slideNext();
  };

  if (isLoadingHomePage) return <></>;

  return (
    <div className="container-wrapper space-y-4">
      <h2 className="text-xl md:text-2xl font-semibold px-4 md:px-0">{listName}</h2>
      <Swiper
        slidesPerView={2}
        spaceBetween={16}
        breakpoints={{
          640: {
            slidesPerView: 3,
            spaceBetween: 20,
          },
          768: {
            slidesPerView: 4,
            spaceBetween: 24,
          },
          1024: {
            slidesPerView: 5,
            spaceBetween: 30,
          },
        }}
        loop={true}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        className="mySwiper relative group px-4 md:px-0"
      >
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
        {/* Desktop Navigation */}
        <div className="absolute hidden lg:flex items-center top-0 left-0 bottom-0 w-[15%] bg-gradient-to-r from-black z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <GrPrevious size={30} className="cursor-pointer text-white" onClick={handlePrevSlide} />
        </div>
        <div className="absolute hidden lg:flex items-center justify-end top-0 right-0 bottom-0 w-[15%] bg-gradient-to-l from-black z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <GrNext size={30} className="cursor-pointer text-white" onClick={handleNextSlide} />
        </div>

        {/* Mobile Navigation */}
        <div className="absolute flex lg:hidden items-center top-1/2 left-2 transform -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <GrPrevious
            size={16}
            className="cursor-pointer text-white mx-auto"
            onClick={handlePrevSlide}
          />
        </div>
        <div className="absolute flex lg:hidden items-center justify-center top-1/2 right-2 transform -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <GrNext size={16} className="cursor-pointer text-white" onClick={handleNextSlide} />
        </div>
      </Swiper>
    </div>
  );
}
