'use client';

import { useEffect } from 'react';
import DetailMovie from 'types/detail-movie';
import type Movie from 'types/movie';
import { FaPlay } from 'react-icons/fa';
import MovieContent from './movie-content';
import ShareButton from './share-button';
import StickyWatchCta from './sticky-watch-cta';
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
 *
 * Layout (redesigned): a single full-bleed cinematic hero (backdrop +
 * bottom-left info cluster) followed by a CENTERED content column rendered by
 * `MovieContent`. The previous offset 3/4-width split was replaced to remove
 * the empty left gutter and let the discovery shelves/grid breathe.
 */
export default function MoviePage({
  movie,
  credit,
  images,
  logoUrl,
  relatedMovies = [],
}: {
  movie: DetailMovie;
  credit: Credit | undefined;
  images: MovieImage[];
  /**
   * TMDB title-card logo for the active locale (vi → en → langless). When
   * `null`/`undefined`, the heading renders as plain text instead.
   */
  logoUrl?: string | null;
  /** "More Like This" — same-genre titles, fetched server-side. */
  relatedMovies?: Movie[];
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
    });
  }, [movie.movie._id]);

  // Locale-aware title display + pattern-localized status/duration.
  // No Groq API calls — saves quota for the synopsis only.
  const primaryTitle = preferredTitle(movie.movie.name, movie.movie.origin_name, locale);
  // Subtitle mirrors `primaryTitle` (locale language) so it anchors the title
  // in the user's UI language even when the TMDB logo replaces the primary
  // text. Hidden when there's no logo (the primary text already serves that
  // role and repeating it would be visual noise).
  const subTitle = primaryTitle;
  const showSubtitle = Boolean(logoUrl) && subTitle.length > 0;
  const episodeCurrent = localizedEpisodeCurrent(movie.movie.episode_current, locale);
  const time = localizedTime(movie.movie.time, locale);
  const hasCategories = Boolean(movie.movie.category && movie.movie.category.length > 0);

  return (
    <div>
      {/* Cinematic full-bleed hero — DESKTOP only (poster + info cluster).
          Mobile uses the single-column streaming layout below. */}
      <div
        className="hidden lg:block relative w-full min-h-[42rem] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${movie.movie.poster_url})` }}
      >
        <div className="absolute inset-0 bg-black/55"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>

        <div className="container-wrapper-movie relative flex min-h-[30rem] items-end px-4 pb-6 lg:min-h-[42rem] lg:px-0 lg:pb-10">
          <div className="flex w-full items-end gap-4 lg:gap-8">
            {/* Poster — kept for the IMDb/Netflix vibe */}
            <div className="w-24 shrink-0 sm:w-32 lg:w-52">
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-custom">
                <Image
                  src={movie.movie.thumb_url}
                  alt={movie.movie.name}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 30vw, 13vw"
                />
              </div>
            </div>

            {/* Info cluster */}
            <div className="min-w-0 flex-1 space-y-4 pb-1 lg:space-y-6">
              <div>
                {logoUrl ? (
                  <MovieLogo
                    src={logoUrl}
                    alt={primaryTitle}
                    className="block max-h-20 w-auto max-w-[20rem] object-contain object-left drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] lg:max-h-28 lg:max-w-[30rem]"
                  />
                ) : (
                  <h1 className="text-2xl font-semibold lg:text-5xl">{primaryTitle}</h1>
                )}
                {showSubtitle && (
                  <h2 className="mt-2 text-base font-normal text-[#bbb6ae] lg:mt-3 lg:text-2xl">
                    {`${subTitle} (${movie.movie.year})`}
                  </h2>
                )}
              </div>

              {/* Meta line: status · duration · quality + ratings */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-200 lg:text-base">
                {episodeCurrent && <span>{episodeCurrent}</span>}
                {time && <span className="text-gray-500">•</span>}
                {time && <span>{time}</span>}
                {movie.movie.quality && (
                  <span className="rounded bg-[#169f3a] px-2 py-0.5 text-xs font-semibold text-white">
                    {movie.movie.quality}
                  </span>
                )}
                <RatingLinks imdb={movie.movie.imdb} tmdb={movie.movie.tmdb} variant="compact" />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3">
                {movie.movie.episode_current !== 'Trailer' && (
                  <Link
                    className="flex items-center gap-x-2 rounded-md bg-[#e20913] px-5 py-2.5 font-semibold uppercase text-white transition duration-200 hover:bg-[#c20810]"
                    href={`/movies/watch/${movie.movie.slug}`}
                  >
                    <FaPlay size={18} />
                    {t('watch')}
                  </Link>
                )}
                <BtnAddToCollection variant="secondary" detailMovie={movie} />
                <ShareButton title={movie.movie.name} />
              </div>

              {/* Genre chips */}
              {hasCategories && (
                <div className="flex flex-wrap gap-2">
                  {movie.movie.category.map((item, index) => (
                    <Link
                      key={index}
                      className="block rounded-2xl border border-gray-600 px-3 py-1 text-xs transition-all duration-300 hover:border-white hover:bg-white hover:text-black lg:text-sm"
                      href={`/movies/type/${item.slug}`}
                    >
                      {localizedCategory(item.slug, locale)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile hero — single column (full-width backdrop + content below).
          Streaming-app pattern (Netflix/Apple): no side poster, full-width
          actions for thumb reach. */}
      <div className="lg:hidden">
        <div
          className="relative w-full aspect-[16/10] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${movie.movie.poster_url})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
          <div className="absolute inset-x-0 bottom-0 px-4 pb-3">
            {logoUrl ? (
              <MovieLogo
                src={logoUrl}
                alt={primaryTitle}
                className="block max-h-16 w-auto max-w-[14rem] object-contain object-left drop-shadow-[0_3px_6px_rgba(0,0,0,0.6)]"
              />
            ) : (
              <h1 className="text-2xl font-semibold drop-shadow">{primaryTitle}</h1>
            )}
          </div>
        </div>

        <div className="space-y-4 px-4 pb-2 pt-3">
          {showSubtitle && (
            <h2 className="text-base font-normal text-[#bbb6ae]">{`${subTitle} (${movie.movie.year})`}</h2>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-200">
            {episodeCurrent && <span>{episodeCurrent}</span>}
            {time && <span className="text-gray-500">•</span>}
            {time && <span>{time}</span>}
            {movie.movie.quality && (
              <span className="rounded bg-[#169f3a] px-2 py-0.5 text-xs font-semibold text-white">
                {movie.movie.quality}
              </span>
            )}
            <RatingLinks imdb={movie.movie.imdb} tmdb={movie.movie.tmdb} variant="compact" />
          </div>

          <div className="space-y-2.5">
            {movie.movie.episode_current !== 'Trailer' && (
              <Link
                href={`/movies/watch/${movie.movie.slug}`}
                className="flex min-h-[48px] w-full items-center justify-center gap-x-2 rounded-lg bg-[#e20913] font-semibold uppercase text-white transition duration-200 hover:bg-[#c20810]"
              >
                <FaPlay size={18} />
                {t('watch')}
              </Link>
            )}
            <div className="flex gap-2.5">
              <div className="flex-1 [&>button]:w-full [&>button]:justify-center">
                <BtnAddToCollection variant="secondary" detailMovie={movie} />
              </div>
              <div className="flex-1 [&>button]:w-full [&>button]:justify-center">
                <ShareButton title={movie.movie.name} />
              </div>
            </div>
          </div>

          {hasCategories && (
            <div className="flex flex-wrap gap-2">
              {movie.movie.category.map((item, index) => (
                <Link
                  key={index}
                  className="block rounded-2xl border border-gray-600 px-3 py-1 text-xs transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
                  href={`/movies/type/${item.slug}`}
                >
                  {localizedCategory(item.slug, locale)}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <MovieContent
        movie={movie}
        credit={credit}
        images={images}
        relatedMovies={relatedMovies}
      />

      <StickyWatchCta
        slug={movie.movie.slug}
        isTrailer={movie.movie.episode_current === 'Trailer'}
      />
    </div>
  );
}
