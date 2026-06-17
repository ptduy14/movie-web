'use client';

import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslations } from 'next-intl';
import { Swiper, SwiperSlide } from 'swiper/react';
import { GrNext, GrPrevious } from 'react-icons/gr';
import firebaseServices from 'services/firebase-services';
import { getRecentMovies as getLocalRecentMovies } from 'lib/recent-movies-storage';
import { getBecauseYouWatched } from 'app/actions';
import RegularMovieItem from '../commons/regular-movie-item';
import type { IRecentMovie } from 'types/recent-movie';
import type Movie from 'types/movie';

/**
 * "Top picks for you" — personalized genre rail derived from the user's
 * most-recently-watched title. Works for logged-in users (Firestore recent)
 * AND guests (localStorage recent). Hidden when there's no watch history or no
 * same-genre titles to suggest.
 *
 * Recent-movie records don't store category, so the genre is resolved server-
 * side from the source movie's detail via the `getBecauseYouWatched` action.
 */
export default function BecauseYouWatchedSection() {
  const t = useTranslations('home');
  const user = useSelector((state: any) => state.auth.user);

  const [items, setItems] = useState<Movie[] | null>(null);
  const swiperRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // 1. Most-recent watched title (cross-device for users, localStorage for guests)
      let list: IRecentMovie[];
      if (user?.id) {
        const res = (await firebaseServices.getRecentMovies(user.id)) as IRecentMovie[];
        list = [...res].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
      } else {
        list = getLocalRecentMovies();
      }

      if (list.length === 0) {
        if (!cancelled) setItems([]);
        return;
      }

      // 2. Same-genre suggestions for the most-recent title
      const source = list[0];
      const raw = (await getBecauseYouWatched(source.slug)) as Movie[];

      // Exclude everything the user has already watched (and the source itself)
      const watchedSlugs = new Set(list.map((m) => m.slug));
      const suggestions = raw.filter((m) => m.slug && !watchedSlugs.has(m.slug)).slice(0, 10);

      if (!cancelled) {
        setItems(suggestions);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!items || items.length === 0) return null;

  return (
    <div className="container-wrapper space-y-4">
      <div className="px-4 md:px-0">
        <h2 className="relative inline-block pl-4 text-xl md:text-2xl font-bold tracking-tight">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 md:h-7 bg-gradient-to-b from-red-500 to-red-700 rounded-full"></span>
          {t('topPicks')}
        </h2>
      </div>

      <Swiper
        slidesPerView={2.2}
        spaceBetween={16}
        breakpoints={{
          640: { slidesPerView: 3, spaceBetween: 20 },
          768: { slidesPerView: 4, spaceBetween: 24 },
          1024: { slidesPerView: 5, spaceBetween: 30 },
        }}
        loop={false}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        className="mySwiper relative group/list px-4 md:px-0"
      >
        {items.map((movie) => (
          <SwiperSlide key={movie._id}>
            <RegularMovieItem movie={movie} />
          </SwiperSlide>
        ))}

        <button
          type="button"
          aria-label="Previous"
          onClick={() => swiperRef.current?.slidePrev()}
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
          onClick={() => swiperRef.current?.slideNext()}
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
          onClick={() => swiperRef.current?.slidePrev()}
          className="absolute flex lg:hidden items-center justify-center top-1/2 left-2 -translate-y-1/2 w-9 h-9 bg-black/60 backdrop-blur-sm rounded-full z-30 opacity-0 group-hover/list:opacity-100 transition-opacity duration-300"
        >
          <GrPrevious size={18} className="text-white" />
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={() => swiperRef.current?.slideNext()}
          className="absolute flex lg:hidden items-center justify-center top-1/2 right-2 -translate-y-1/2 w-9 h-9 bg-black/60 backdrop-blur-sm rounded-full z-30 opacity-0 group-hover/list:opacity-100 transition-opacity duration-300"
        >
          <GrNext size={18} className="text-white" />
        </button>
      </Swiper>
    </div>
  );
}
