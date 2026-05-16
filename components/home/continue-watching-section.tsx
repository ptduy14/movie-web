'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useTranslations } from 'next-intl';
import { Swiper, SwiperSlide } from 'swiper/react';
import { GrNext, GrPrevious } from 'react-icons/gr';
import { toast } from 'react-toastify';
import firebaseServices from 'services/firebase-services';
import {
  getRecentMovies as getLocalRecentMovies,
  removeRecentMovie as removeLocalRecentMovie,
} from 'lib/recent-movies-storage';
import ContinueWatchingItem from '../commons/continue-watching-item';
import type { IRecentMovie } from 'types/recent-movie';

const MAX_VISIBLE = 10;

export default function ContinueWatchingSection() {
  const t = useTranslations('home');
  const tToast = useTranslations('toasts');
  const user = useSelector((state: any) => state.auth.user);

  const [movies, setMovies] = useState<IRecentMovie[] | null>(null);
  const swiperRef = useRef<any>(null);

  const handlePrevSlide = () => swiperRef.current?.slidePrev();
  const handleNextSlide = () => swiperRef.current?.slideNext();

  const handleDelete = useCallback(
    async (movieId: string) => {
      setMovies((prev) => (prev ? prev.filter((m) => m.id !== movieId) : prev));
      try {
        if (user?.id) {
          const ok = await firebaseServices.removeRecentMovie(user.id, movieId);
          if (!ok) throw new Error('Firestore delete failed');
        } else {
          removeLocalRecentMovie(movieId);
        }
        toast.success(tToast('removedFromRecent'));
      } catch {
        toast.error(tToast('genericError'));
      }
    },
    [user?.id, tToast]
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      let list: IRecentMovie[];
      if (user?.id) {
        const res = (await firebaseServices.getRecentMovies(user.id)) as IRecentMovie[];
        list = [...res].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
      } else {
        list = getLocalRecentMovies();
      }
      if (!cancelled) setMovies(list.slice(0, MAX_VISIBLE));
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!movies || movies.length === 0) return null;

  return (
    <div className="container-wrapper space-y-4">
      <div className="px-4 md:px-0">
        <h2 className="relative inline-block pl-4 text-xl md:text-2xl font-bold tracking-tight">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 md:h-7 bg-gradient-to-b from-red-500 to-red-700 rounded-full"></span>
          {t('continueWatching')}
        </h2>
      </div>
      <Swiper
        slidesPerView={1.2}
        spaceBetween={16}
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 16 },
          768: { slidesPerView: 3, spaceBetween: 20 },
          1024: { slidesPerView: 4, spaceBetween: 24 },
        }}
        loop={false}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        className="mySwiper relative group/list px-4 md:px-0"
      >
        {movies.map((movie) => (
          <SwiperSlide key={movie.id}>
            <ContinueWatchingItem movie={movie} onDelete={handleDelete} />
          </SwiperSlide>
        ))}

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
