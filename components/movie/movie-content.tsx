'use client';

import type { ReactNode } from 'react';
import Country from 'types/country';
import DetailMovie from 'types/detail-movie';
import Trailer from './trailer';
import ActorList from '../actor/actor-list';
import Credit from 'types/credit';
import isNonEmpty from 'utils/is-none-empty';
import MovieSummary from './movie-summary';
import CommentSection from '../comment';
import MovieImage from 'types/movie-image';
import MovieImageList from '../movie-images/movie-image-list';
import RelatedMovies from './related-movies';
import type MovieType from 'types/movie';
import { Link } from 'i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { localizedCountry, localizedLang } from 'constants/i18n-mappings';
import type { Locale } from 'i18n/routing';

/**
 * Detail-page body. Rendered in a CENTERED `container-wrapper-movie` (no
 * offset column) as a single vertical flow:
 *   Overview + Details (balanced 2-col on desktop) → Cast shelf → Stills →
 *   Trailer → More Like This (grid) → Comments (narrow column).
 *
 * Marked `'use client'` for the same reasons as `MoviePage` — most descendants
 * (CommentSection, ActorList, MovieImageList, MovieSummary) are already client
 * components.
 */
export default function MovieContent({
  movie,
  credit,
  images,
  relatedMovies = [],
}: {
  movie: DetailMovie;
  credit: Credit | undefined;
  images: MovieImage[];
  relatedMovies?: MovieType[];
}) {
  const t = useTranslations('movie.info');
  const tCommon = useTranslations('common');
  const tMovie = useTranslations('movie');
  const locale = useLocale() as Locale;
  const directors = isNonEmpty(movie.movie.director)
    ? movie.movie.director?.join(', ')
    : tCommon('updating');

  const countryChips = (
    <div className="flex flex-wrap gap-2">
      {movie.movie.country.map((item: Country, index) => (
        <Link
          key={index}
          href={`/movies/country/${item.slug}`}
          className="inline-block rounded-full border border-gray-600 px-3 py-1 text-xs transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
        >
          {localizedCountry(item.slug, locale)}
        </Link>
      ))}
    </div>
  );

  return (
    <div className="container-wrapper-movie px-4 py-8 lg:px-0 lg:py-10">
      <div className="space-y-10 lg:space-y-12">
        {/* Overview + Details — balanced, centered (no offset column) */}
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
          <div className="space-y-3 lg:flex-[0_0_63%]">
            <h3 className="text-lg font-bold lg:text-xl">{t('content')}</h3>
            <MovieSummary summary={movie.movie.content} expandable />
          </div>

          <div className="lg:flex-1">
            <div className="rounded-lg bg-white/5 p-4 lg:p-5">
              <h3 className="mb-4 text-lg font-bold lg:text-xl">{t('title')}</h3>
              <div className="space-y-3 text-sm lg:text-base">
                <InfoRow label={t('director')}>
                  <span className="font-medium">{directors}</span>
                </InfoRow>
                <InfoRow label={t('country')}>{countryChips}</InfoRow>
                <InfoRow label={t('releaseYear')}>
                  <span className="font-medium">{movie.movie.year}</span>
                </InfoRow>
                {movie.movie.lang && (
                  <InfoRow label={t('language')}>
                    <span className="font-medium">{localizedLang(movie.movie.lang, locale)}</span>
                  </InfoRow>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cast */}
        <ActorList movie={movie} credit={credit} />

        {/* Stills */}
        {images && images.length > 0 && <MovieImageList images={images} />}

        {/* Trailer */}
        {movie.movie.trailer_url !== '' && <Trailer trailer={movie.movie.trailer_url} />}

        {/* More like this — grid */}
        {relatedMovies.length > 0 && (
          <RelatedMovies title={tMovie('moreLikeThis')} movies={relatedMovies} />
        )}

        {/* Comments — narrow, centered column for readability */}
        <div className="mx-auto w-full max-w-3xl">
          <CommentSection movie={movie} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-24 shrink-0 pt-0.5 text-xs uppercase tracking-wide text-gray-400 lg:w-28 lg:text-sm">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
