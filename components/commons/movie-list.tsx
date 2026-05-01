'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import NewlyMovieItem from './newly-movie-item';
import NewlyMovie from 'types/newly-movie';
import Movie from 'types/movie';
import RegularMovieItem from './regular-movie-item';
import { GrNext, GrPrevious } from 'react-icons/gr';
import { useRef } from 'react';
import { useHomePageLoadingContext } from '../context/home-page-loading-context';
import MovieListSkeleton from './movie-list-skeleton';

interface MovieListProps {
  listName: string;
  movies: NewlyMovie[] | Movie[];
  isNewlyMovieItem: boolean;
}

export default function MovieList({ listName, movies, isNewlyMovieItem }: MovieListProps) {
  const { isLoadingHomePage } = useHomePageLoadingContext();

  const swiperRef = useRef<any>(null);

  const handlePrevSlide = () => {
    swiperRef.current?.slidePrev();
  };

  const handleNextSlide = () => {
    swiperRef.current?.slideNext();
  };

  if (isLoadingHomePage) return <MovieListSkeleton />;

  return (
    <div className="container-wrapper space-y-4">
      {/* Section header — Netflix-style with red accent bar */}
      <div className="px-4 md:px-0">
        <h2 className="relative inline-block pl-4 text-xl md:text-2xl font-bold tracking-tight">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 md:h-7 bg-gradient-to-b from-red-500 to-red-700 rounded-full"></span>
          {listName}
        </h2>
      </div>

      {/*
        IMPORTANT: use a NAMED group (`group/list`) here, NOT the default `group`.
        Each MovieCard inside also uses `group` (default) for its own hover overlay.
        Using the same name on both ancestors would make ANY card's overlay trigger
        whenever the user hovers anywhere in the swiper (descendant-selector cascade).
        Named groups scope `group-hover/list:` selectors to this row only.
      */}
      <Swiper
        slidesPerView={2}
        spaceBetween={16}
        breakpoints={{
          640: { slidesPerView: 3, spaceBetween: 20 },
          768: { slidesPerView: 4, spaceBetween: 24 },
          1024: { slidesPerView: 5, spaceBetween: 30 },
        }}
        loop={true}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        className="mySwiper relative group/list px-4 md:px-0"
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

        {/* Desktop Navigation — full-height side panels */}
        <button
          type="button"
          aria-label="Previous"
          onClick={handlePrevSlide}
          className="absolute hidden lg:flex items-center justify-start top-0 left-0 bottom-0 w-[8%] z-30 bg-gradient-to-r from-black/95 via-black/50 to-transparent opacity-0 group-hover/list:opacity-100 transition-opacity duration-300 cursor-pointer"
        >
          <GrPrevious
            size={42}
            className="text-white drop-shadow-lg ml-2 hover:scale-125 transition-transform duration-200"
          />
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={handleNextSlide}
          className="absolute hidden lg:flex items-center justify-end top-0 right-0 bottom-0 w-[8%] z-30 bg-gradient-to-l from-black/95 via-black/50 to-transparent opacity-0 group-hover/list:opacity-100 transition-opacity duration-300 cursor-pointer"
        >
          <GrNext
            size={42}
            className="text-white drop-shadow-lg mr-2 hover:scale-125 transition-transform duration-200"
          />
        </button>

        {/* Mobile Navigation — floating circles */}
        <button
          type="button"
          aria-label="Previous"
          onClick={handlePrevSlide}
          className="absolute flex lg:hidden items-center justify-center top-1/2 left-2 -translate-y-1/2 w-9 h-9 bg-black/60 backdrop-blur-sm rounded-full z-30 opacity-0 group-hover/list:opacity-100 transition-opacity duration-300"
        >
          <GrPrevious size={18} className="text-white" />
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={handleNextSlide}
          className="absolute flex lg:hidden items-center justify-center top-1/2 right-2 -translate-y-1/2 w-9 h-9 bg-black/60 backdrop-blur-sm rounded-full z-30 opacity-0 group-hover/list:opacity-100 transition-opacity duration-300"
        >
          <GrNext size={18} className="text-white" />
        </button>
      </Swiper>
    </div>
  );
}
