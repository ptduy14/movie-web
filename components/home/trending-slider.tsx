'use client';

import { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { GrNext, GrPrevious } from 'react-icons/gr';
import { FaStar } from 'react-icons/fa';
import { Link } from 'i18n/routing';

export interface TrendingItem {
  rank: number;
  slug: string;
  title: string;
  poster_url: string;
  year: number;
  rating: number;
}

interface TrendingSliderProps {
  items: TrendingItem[];
}

export default function TrendingSlider({ items }: TrendingSliderProps) {
  const swiperRef = useRef<any>(null);

  const handlePrevSlide = () => swiperRef.current?.slidePrev();
  const handleNextSlide = () => swiperRef.current?.slideNext();

  return (
    // Named group (`group/list`) — see commons/movie-list.tsx for the rationale:
    // each card uses default `group` for hover, so the ancestor must be scoped.
    <Swiper
      slidesPerView={3}
      spaceBetween={12}
      breakpoints={{
        768: { slidesPerView: 5, spaceBetween: 20 },
      }}
      onSwiper={(swiper) => (swiperRef.current = swiper)}
      className="mySwiper relative group/list px-4 md:px-0"
    >
      {items.map((movie) => (
        <SwiperSlide key={movie.slug}>
          <Link
            href={`/movies/${movie.slug}`}
            className="relative flex items-end group"
          >
            <span
              className="relative z-0 flex-shrink-0 font-black leading-none pb-3 -mr-5 select-none pointer-events-none text-right"
              style={{
                fontSize: 'clamp(56px, 8.5vw, 128px)',
                width: 'clamp(36px, 5.2vw, 80px)',
                WebkitTextStroke: '3px rgba(255,255,255,0.30)',
                color: 'transparent',
              }}
            >
              {movie.rank}
            </span>

            <div className="relative z-10 flex-1 min-w-0 rounded-xl overflow-hidden bg-gray-800 shadow-lg">
              <div className="aspect-[2/3]">
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.07]"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 gap-1">
                <p className="text-xs font-bold uppercase tracking-wide leading-tight line-clamp-2">
                  {movie.title}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-300">
                  <FaStar className="text-yellow-400 shrink-0 text-[9px]" />
                  <span>{movie.rating.toFixed(1)}</span>
                  <span>·</span>
                  <span>{movie.year}</span>
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border-2 border-white/60 flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300">
                  <svg className="w-4 h-4 fill-white ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </SwiperSlide>
      ))}

      {/* Desktop navigation — full-height side panels */}
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

      {/* Mobile navigation — floating circles */}
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
  );
}
