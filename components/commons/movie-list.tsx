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
  const {isLoadingHomePage} = useHomePageLoadingContext();
  
  const swiperRef = useRef<any>(null);

  const handlePrevSlide = () => {
    swiperRef.current.slidePrev();
  }

  const handleNextSlide = () => {
    swiperRef.current.slideNext();
  }

  if (isLoadingHomePage) return <></>
  
  return (
    <div className="container-wrapper space-y-4">
      <h2 className="text-2xl font-semibold">{listName}</h2>
      <Swiper slidesPerView={5} spaceBetween={30} loop={true} onSwiper={(swiper) => swiperRef.current = swiper} className="mySwiper relative group">
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
        <div className="absolute hidden group-hover:flex items-center top-0 left-0 bottom-0 w-[15%] bg-gradient-to-r from-black z-10">
          <GrPrevious size={30} className='cursor-pointer' onClick={handlePrevSlide}/>
        </div>
        <div className="absolute hidden group-hover:flex items-center justify-end top-0 right-0 bottom-0 w-[15%] bg-gradient-to-l from-black z-10">
          <GrNext size={30} className='cursor-pointer' onClick={handleNextSlide}/>
        </div>
      </Swiper>
    </div>
  );
}
