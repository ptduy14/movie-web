'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Autoplay } from 'swiper/modules';
import NewlyMovie from 'types/newly-movie';
import HeroMovieItem from '../commons/hero-movie-item';
import { useEffect, useRef, useState } from 'react';
import { getDetailMovieServerAction, getHeroLogoUrlsServerAction } from 'app/actions';
import DetailMovie from 'types/detail-movie';
import HeroSectionSkeleton from './hero-section-skeleton';
import { useHomePageLoadingContext } from '../context/home-page-loading-context';
import { FaChevronRight } from 'react-icons/fa6';

export default function HeroSection({ movies }: { movies: NewlyMovie[] }) {
  const [detailMovies, setDetailMovies] = useState<DetailMovie[]>([]);
  const [logoUrls, setLogoUrls] = useState<Record<string, string | null>>({});
  const [hasFetched, setHasFetched] = useState<boolean>(false);
  const swiperRef = useRef<any>(null);

  const { setISLoadingHomePage } = useHomePageLoadingContext();

  useEffect(() => {
    let cancelled = false;
    setHasFetched(false);

    const getDescriptionMovies = async () => {
      // Fetch details + logos in parallel — logos hit TMDB's cached endpoint
      // and shouldn't gate the hero render if they're slow.
      const [data, logos] = await Promise.all([
        getDetailMovieServerAction(movies),
        getHeroLogoUrlsServerAction(movies),
      ]);
      if (cancelled) return;
      setDetailMovies(data);
      setLogoUrls(logos);
      setHasFetched(true);
      setISLoadingHomePage(false);
    };

    getDescriptionMovies();

    return () => {
      cancelled = true;
    };
  }, [movies, setISLoadingHomePage]);

  const handleClickToNextSlide = () => {
    swiperRef.current?.slideNext();
  };

  if (!hasFetched) {
    return <HeroSectionSkeleton />;
  }

  // Build a quick lookup so we can pair each DetailMovie with its source NewlyMovie
  // (NewlyMovie carries fields not returned by detail endpoint: imdb, modified, sub_docquyen, ...).
  const listItemBySlug = new Map(movies.map((m) => [m.slug, m]));

  return (
    <div className="relative">
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
              <HeroMovieItem
                detailMovie={movie}
                listItem={listItemBySlug.get(movie.movie.slug)}
                logoUrl={logoUrls[movie.movie.slug] ?? null}
                onNextSlide={handleClickToNextSlide}
              />
            </SwiperSlide>
          );
        })}
      </Swiper>
      {/* Desktop Navigation Button — mobile button is rendered inside HeroMovieItem
          so it can vertically center on the variable-height poster image. */}
      <div
        className="hidden lg:block absolute z-10 top-[18rem] right-6 border border-white p-4 rounded-full group hover:border-black hover:bg-white cursor-pointer transition-all duration-300"
        onClick={handleClickToNextSlide}
      >
        <FaChevronRight className="text-white group-hover:text-black transition-colors duration-300" />
      </div>
    </div>
  );
}
