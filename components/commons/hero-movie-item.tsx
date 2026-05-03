'use client';
import { FaPlay, FaImdb } from 'react-icons/fa';
import MovieSummary from '../movie/movie-summary';
import BtnAddToCollection from '../buttons/btn-add-to-collection';
import DetailMovie from 'types/detail-movie';
import NewlyMovie from 'types/newly-movie';
import TMDBLogo from '../logos/TMDB-Logo';
import Category from 'types/category';
import { GoDotFill } from 'react-icons/go';
import { Link } from 'i18n/routing';
import QualityLangBadge from './badges/quality-lang-badge';
import ExclusiveBadge from './badges/exclusive-badge';
import NewUpdateBadge from './badges/new-update-badge';
import { useTranslations, useLocale } from 'next-intl';
import {
  preferredTitle,
  secondaryTitle,
  localizedCategory,
  localizedEpisodeCurrent,
} from 'constants/i18n-mappings';
import type { Locale } from 'i18n/routing';

interface HeroMovieItemProps {
  detailMovie: DetailMovie;
  /**
   * Original list item from `/v1/api/home`. Carries enriched fields
   * (`imdb`, `modified`, `sub_docquyen`, `alternative_names`) that the
   * detail endpoint may not return. Falls back to `detailMovie.movie`
   * fields when missing.
   */
  listItem?: NewlyMovie;
}

const isValidScore = (score?: number) => typeof score === 'number' && score > 0;

const formatVoteCount = (count?: number) => {
  if (!count || count <= 0) return '';
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
};

export default function HeroMovieItem({ detailMovie, listItem }: HeroMovieItemProps) {
  const t = useTranslations('movie');
  const tRating = useTranslations('movie.rating');
  const locale = useLocale() as Locale;
  const movie = detailMovie.movie;

  // Prefer listItem fields (guaranteed from /v1/api/home), fall back to detail
  const imdb = listItem?.imdb ?? movie.imdb;
  const tmdb = listItem?.tmdb ?? movie.tmdb;
  const modifiedAt = listItem?.modified?.time ?? movie.modified?.time;
  const subDocquyen = listItem?.sub_docquyen ?? movie.sub_docquyen;
  const quality = listItem?.quality ?? movie.quality;
  const lang = listItem?.lang ?? movie.lang;

  // For non-vi locale, prefer the source-language `origin_name` as primary
  // title to avoid spending Groq quota on title translation.
  const primaryTitle = preferredTitle(movie.name, movie.origin_name, locale);
  const subTitle = secondaryTitle(movie.name, movie.origin_name, locale);

  const movieCategory = movie.category.map((item: Category, index) => (
    <span key={index}>
      {localizedCategory(item.slug, locale)}
      {index < movie.category.length - 1 ? '/' : ''}
    </span>
  ));

  const showImdb = isValidScore(imdb?.vote_average);
  const showTmdb = isValidScore(tmdb?.vote_average);

  return (
    <div
      className="container-wrapper relative w-full h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${movie.poster_url})` }}
    >
      <div className="absolute inset-0 bg-black opacity-45"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black to-50%"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black to-10%"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black to-10%"></div>
      <div className="absolute inset-0 bg-gradient-to-l from-black to-10%"></div>

      {/* Desktop Layout */}
      <div className="hidden lg:block absolute w-2/4 bottom-[5rem] left-6 space-y-5">
        {/* Status badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          {subDocquyen ? <ExclusiveBadge /> : <NewUpdateBadge modifiedAt={modifiedAt} />}
          <QualityLangBadge quality={quality} lang={lang} />
        </div>

        <h2 className="text-5xl font-bold">{primaryTitle}</h2>
        {subTitle && <h3 className="text-xl text-white/70 -mt-3">{subTitle}</h3>}

        <div className="flex items-center gap-x-2 text-sm">
          <div>{movie.year}</div>
          <GoDotFill size={12} />
          <div>{movieCategory}</div>
          <GoDotFill size={12} />
          <div>{localizedEpisodeCurrent(movie.episode_current, locale)}</div>
        </div>

        {/* Ratings row — TMDB + IMDb side-by-side */}
        <div className="flex items-center gap-x-4 flex-wrap">
          {showTmdb && (
            <div className="flex items-center gap-x-2">
              <div className="w-[6rem]">
                <TMDBLogo />
              </div>
              <div>
                <span className="font-bold">{tmdb!.vote_average.toFixed(1)}</span>
                <span className="text-white/60">/10</span>
              </div>
              {tmdb!.vote_count > 0 && (
                <span className="text-sm text-white/60">
                  ({formatVoteCount(tmdb!.vote_count)} {tRating('votes')})
                </span>
              )}
            </div>
          )}
          {showImdb && (
            <div className="flex items-center gap-x-2">
              <FaImdb className="text-yellow-400 text-3xl" />
              <div>
                <span className="font-bold">{imdb!.vote_average.toFixed(1)}</span>
                <span className="text-white/60">/10</span>
              </div>
              {imdb!.vote_count > 0 && (
                <span className="text-sm text-white/60">
                  ({formatVoteCount(imdb!.vote_count)} {tRating('votes')})
                </span>
              )}
            </div>
          )}
        </div>

        <MovieSummary summary={movie.content || t('info.fallbackContent')} />
        <div className="space-x-5 flex items-center">
          <Link
            href={`/movies/${movie.slug}`}
            className="inline-block py-3 px-5 bg-white text-black rounded-md"
          >
            <div className="flex align-top space-x-2">
              <FaPlay size={18} />
              <span className="block leading-4 font-semibold">{t('watch')}</span>
            </div>
          </Link>
          <BtnAddToCollection variant="primary" detailMovie={detailMovie} />
        </div>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden absolute inset-0 flex flex-col justify-end">
        <div className="bg-gradient-to-t from-black via-black/80 to-transparent p-4 pb-8">
          {/* Status badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {subDocquyen ? <ExclusiveBadge /> : <NewUpdateBadge modifiedAt={modifiedAt} />}
            <QualityLangBadge quality={quality} lang={lang} />
          </div>

          {/* Movie Title */}
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 leading-tight">
            {primaryTitle}
          </h2>
          {subTitle && <h3 className="text-sm md:text-base text-white/60 mb-2">{subTitle}</h3>}

          {/* Movie Metadata */}
          <div className="flex items-center gap-x-3 mb-3 text-sm text-white/90 flex-wrap">
            <div>{movie.year}</div>
            <div className="text-white/60">•</div>
            <div>{localizedEpisodeCurrent(movie.episode_current, locale)}</div>
            {showTmdb && (
              <>
                <div className="text-white/60">•</div>
                <div className="text-white text-sm">
                  <span className="font-bold">{tmdb!.vote_average.toFixed(1)}</span>
                  <span className="text-white/60">/10 TMDB</span>
                </div>
              </>
            )}
            {showImdb && (
              <>
                <div className="text-white/60">•</div>
                <div className="flex items-center gap-x-1 text-sm">
                  <FaImdb className="text-yellow-400 text-base" />
                  <span className="font-bold">{imdb!.vote_average.toFixed(1)}</span>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href={`/movies/${movie.slug}`}
              className="block w-full bg-white text-black rounded-lg py-3 px-4 text-center font-semibold"
            >
              <div className="flex items-center justify-center gap-x-2">
                <FaPlay size={16} />
                <span>{t('watch')}</span>
              </div>
            </Link>
            <div className="w-full">
              <BtnAddToCollection variant="primary" detailMovie={detailMovie} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
