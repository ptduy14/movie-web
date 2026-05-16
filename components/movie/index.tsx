'use client';

import { useEffect } from 'react';
import DetailMovie from 'types/detail-movie';
import { FaPlay } from 'react-icons/fa';
import MovieContent from './movie-content';
import Credit from 'types/credit';
import BtnAddToCollection from '../buttons/btn-add-to-collection';
import { Link } from 'i18n/routing';
import Image from 'next/image';
import MovieImage from 'types/movie-image';
import RatingLinks from '../commons/rating-links';
import MovieLogo from '../commons/movie-logo';
import { useLocale, useTranslations } from 'next-intl';
import { analytics } from 'lib/posthog/events';
import {
  localizedCategory,
  localizedEpisodeCurrent,
  localizedTime,
  preferredTitle,
} from 'constants/i18n-mappings';
import type { Locale } from 'i18n/routing';

/**
 * Movie detail page shell.
 *
 * Marked `'use client'` because:
 *  - Most children (BtnAddToCollection, ActorList, MovieImageList,
 *    CommentSection) are already client components.
 *  - Avoids the async server component complexity that triggered an
 *    "Internal error: Cannot read properties of null" inside the React
 *    Server Components reconciler when this was an `async` server component
 *    with `getTranslations()` / `getLocale()` calls combined with nested
 *    async children.
 *  - Translations and locale are read via the `useTranslations` / `useLocale`
 *    hooks instead — same data, simpler render path.
 *
 * Note: the parent `[slug]/page.tsx` server component still fetches movie /
 * credits / images data and passes them as props.
 */
export default function MoviePage({
  movie,
  credit,
  images,
  logoUrl,
}: {
  movie: DetailMovie;
  credit: Credit | undefined;
  images: MovieImage[];
  /**
   * TMDB title-card logo for the active locale (vi → en → langless). When
   * `null`/`undefined`, the heading renders as plain text instead.
   */
  logoUrl?: string | null;
}) {
  const t = useTranslations('movie');
  const locale = useLocale() as Locale;

  useEffect(() => {
    analytics.movieViewed({
      movie_id: movie.movie._id,
      slug: movie.movie.slug,
      title: movie.movie.name,
      type: movie.movie.type,
      genre: movie.movie.category?.map((c) => c.name),
      country: movie.movie.country?.map((c) => c.name),
      year: movie.movie.year,
      thumb_url: movie.movie.thumb_url,
      tmdb_id: movie.movie.tmdb?.id,
      tmdb_type: movie.movie.tmdb?.type,
      tmdb_rating: movie.movie.tmdb?.vote_average,
    });
  }, [movie.movie._id]);

  // Locale-aware title display + pattern-localized status/duration.
  // No Groq API calls — saves quota for the synopsis only.
  const primaryTitle = preferredTitle(movie.movie.name, movie.movie.origin_name, locale);
  // Subtitle here intentionally mirrors `primaryTitle` (locale-language) so it
  // anchors the title in the user's UI language even when the TMDB logo
  // replaces the primary text in a different language. Hide when no logo —
  // the primary text already serves the locale-anchor role and showing the
  // same string twice would just be visual noise.
  const subTitle = primaryTitle;
  const showSubtitle = Boolean(logoUrl) && subTitle.length > 0;
  const episodeCurrent = localizedEpisodeCurrent(movie.movie.episode_current, locale);
  const time = localizedTime(movie.movie.time, locale);

  return (
    <div>
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div
          className="relative w-full h-[37rem] bg-no-repeat bg-cover flex items-end justify-center"
          style={{ backgroundImage: `url(${movie.movie.poster_url})` }}
        >
          <div className="bg-black h-full w-full opacity-65 absolute inset-0"></div>
          <div className="container-wrapper-movie relative flex justify-end">
            <div className="w-1/4 absolute left-0 top-0">
              <div className="relative w-full aspect-[2/3]">
                <Image
                  src={movie.movie.thumb_url}
                  alt={movie.movie.name}
                  fill
                  className="object-cover shadow-custom"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
              </div>
              {movie.movie.episode_current !== 'Trailer' && (
                <Link
                  className="bg-[#e20913] flex items-center justify-center text-center py-3 uppercase font-semibold text-lg gap-x-2 rounded-md mt-5"
                  href={`/movies/watch/${movie.movie.slug}`}
                >
                  <FaPlay size={25} />
                  {t('watch')}
                </Link>
              )}
            </div>
            <div className=" w-3/4 pl-14 pb-6 space-y-6 ">
              <div>
                {logoUrl ? (
                  <MovieLogo
                    src={logoUrl}
                    alt={primaryTitle}
                    className="block max-h-32 w-auto max-w-[30rem] object-contain object-left drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
                  />
                ) : (
                  <h3 className="text-5xl font-medium">{primaryTitle}</h3>
                )}
                {showSubtitle && (
                  <h4 className="text-2xl text-[#bbb6ae] font-normal mt-2">{`${subTitle} (${movie.movie.year})`}</h4>
                )}
              </div>
              <div className="space-y-5">
                <div>
                  {t('info.status')}: {episodeCurrent}
                </div>
                <div>
                  {t('info.duration')}: {time}
                </div>
                <div className="px-3 py-1 bg-[#169f3a] inline-block rounded-md font-semibold">
                  {movie.movie.quality}
                </div>
                <RatingLinks imdb={movie.movie.imdb} tmdb={movie.movie.tmdb} />
                <div className="flex justify-between items-center">
                  <BtnAddToCollection variant="secondary" detailMovie={movie} />
                  <div className="flex gap-x-2">
                    {movie.movie.category?.map((item, index) => (
                      <Link
                        key={index}
                        className="text-sm block border-[1px] border-gray-600 px-3 p-1 rounded-2xl hover:bg-white hover:text-black hover:border-white transition-all duration-500"
                        href={`/movies/type/${item.slug}`}
                      >
                        {localizedCategory(item.slug, locale)}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden">
        {/* Hero Section */}
        <div
          className="relative w-full h-[50vh] bg-no-repeat bg-cover bg-center"
          style={{ backgroundImage: `url(${movie.movie.poster_url})` }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

          {/* Movie Poster and Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex gap-x-4 items-end">
              {/* Movie Poster */}
              <div className="relative w-24 h-36 flex-shrink-0">
                <Image
                  src={movie.movie.thumb_url}
                  alt={movie.movie.name}
                  fill
                  className="object-cover rounded-lg shadow-lg"
                  sizes="96px"
                />
              </div>

              {/* Movie Info */}
              <div className="flex-1 min-w-0">
                {logoUrl ? (
                  <MovieLogo
                    src={logoUrl}
                    alt={primaryTitle}
                    className="block max-h-12 w-auto max-w-full object-contain object-left mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)]"
                  />
                ) : (
                  <h1 className="text-xl font-bold text-white mb-1 truncate">{primaryTitle}</h1>
                )}
                {showSubtitle && (
                  <h2 className="text-base text-gray-300 mb-2 truncate">
                    {subTitle} ({movie.movie.year})
                  </h2>
                )}

                {/* Quick Info */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-300">
                  <span>{episodeCurrent}</span>
                  <span>•</span>
                  <span>{time}</span>
                  <span>•</span>
                  <span className="bg-[#169f3a] px-2 py-0.5 rounded text-white text-xs">
                    {movie.movie.quality}
                  </span>
                </div>

                {/* Ratings (TMDB + IMDb) */}
                <div className="mt-2">
                  <RatingLinks imdb={movie.movie.imdb} tmdb={movie.movie.tmdb} variant="compact" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="bg-gray-900/50 p-4 space-y-4">
          {/* Watch Button */}
          {movie.movie.episode_current !== 'Trailer' && (
            <Link
              className="w-full bg-[#e20913] flex items-center justify-center text-center py-3 uppercase font-semibold text-lg gap-x-2 rounded-lg"
              href={`/movies/watch/${movie.movie.slug}`}
            >
              <FaPlay size={20} />
              {t('watch')}
            </Link>
          )}

          {/* Collection Button */}
          <div className="flex justify-center">
            <BtnAddToCollection variant="secondary" detailMovie={movie} />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 justify-center">
            {movie.movie.category?.map((item, index) => (
              <Link
                key={index}
                className="text-sm border border-gray-600 px-3 py-1 rounded-full hover:bg-white hover:text-black hover:border-white transition-all duration-300"
                href={`/movies/type/${item.slug}`}
              >
                {localizedCategory(item.slug, locale)}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <MovieContent movie={movie} credit={credit} images={images} />
    </div>
  );
}
