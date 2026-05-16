'use client';

import { Link } from 'i18n/routing';
import { useLocale } from 'next-intl';
import Movie from 'types/movie';
import MovieCollection from 'types/movie-collection';
import Image from 'next/image';
import RatingBadge from './badges/rating-badge';
import QualityLangBadge from './badges/quality-lang-badge';
import ExclusiveBadge from './badges/exclusive-badge';
import NewUpdateBadge from './badges/new-update-badge';
import MovieCardOverlay from './movie-card-overlay';
import { preferredTitle, secondaryTitle, localizedCountry } from 'constants/i18n-mappings';
import type { Locale } from 'i18n/routing';

export default function RegularMovieItem({ movie }: { movie: Movie | MovieCollection }) {
  // MovieCollection lacks v1/home extension fields — narrow with type guard
  const isMovieType = isMovie(movie);
  const locale = useLocale() as Locale;
  const primaryTitle = preferredTitle(movie.name, movie.origin_name, locale);
  const subTitle = secondaryTitle(movie.name, movie.origin_name, locale);

  // Netflix-style `year · country` meta line for non-vi locales (matches
  // NewlyMovieItem). Only computable for the `Movie` shape — `MovieCollection`
  // (Firestore-backed) lacks year/country fields, so we fall back to empty.
  const metaLine =
    locale !== 'vi' && isMovieType
      ? [
          movie.year ? String(movie.year) : '',
          movie.country?.[0]?.slug ? localizedCountry(movie.country[0].slug, locale) : '',
        ]
          .filter(Boolean)
          .join(' · ')
      : '';
  const secondLine = locale === 'vi' ? subTitle : metaLine;

  return (
    <Link className="group block relative h-auto space-y-2 select-none" href={`/movies/${movie.slug}`}>
      {/* See NewlyMovieItem note: `isolate` scopes badge z-indices so they
          don't bleed through header dropdowns (z-10). */}
      <div className="relative w-full aspect-[2/3] overflow-hidden rounded isolate">
        <Image
          src={`${isMovieType ? process.env.NEXT_PUBLIC_IMG_DOMAIN + movie.thumb_url : movie.thumb_url}`}
          fill={true}
          alt={movie.name}
          sizes="100%"
        />

        {/* Top-left: Exclusive or NEW (only on Movie shape) */}
        {isMovieType && (
          <div className="absolute top-1.5 left-1.5 z-20 flex flex-col gap-1">
            {movie.sub_docquyen ? (
              <ExclusiveBadge />
            ) : (
              <NewUpdateBadge modifiedAt={movie.modified?.time} />
            )}
          </div>
        )}

        {/* Top-right: quality + lang */}
        <div className="absolute top-1.5 right-1.5 z-20">
          <QualityLangBadge quality={movie.quality} lang={movie.lang} />
        </div>

        {/* Bottom rating — synced fade with overlay (300ms enter delay) */}
        {isMovieType && (movie.imdb || movie.tmdb) && (
          <div className="absolute bottom-0 left-0 right-0 z-20 px-1.5 py-1.5 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 group-hover:opacity-0 group-hover:delay-300">
            <RatingBadge imdb={movie.imdb} tmdb={movie.tmdb} />
          </div>
        )}

        {/* Hover info overlay.
            MovieCollection lacks rich fields (year/imdb/...) so we only pass them
            when the type guard confirms a Movie shape.
            collectionItem: Movie path uses _id; MovieCollection path passes through. */}
        <MovieCardOverlay
          name={primaryTitle}
          year={isMovieType ? movie.year : undefined}
          episodeCurrent={isMovieType ? movie.episode_current : undefined}
          categories={isMovieType ? movie.category : undefined}
          countries={isMovieType ? movie.country : undefined}
          time={isMovieType ? movie.time : undefined}
          imdb={isMovieType ? movie.imdb : undefined}
          tmdb={isMovieType ? movie.tmdb : undefined}
          collectionItem={
            isMovieType
              ? {
                  id: movie._id,
                  slug: movie.slug,
                  thumb_url: movie.thumb_url,
                  name: movie.name,
                  origin_name: movie.origin_name,
                  lang: movie.lang ?? '',
                  quality: movie.quality ?? '',
                }
              : movie
          }
        />
      </div>

      <div>
        <div className="truncate">{primaryTitle}</div>
        {secondLine && <div className="truncate text-sm text-[#9B9285]">{secondLine}</div>}
      </div>
    </Link>
  );
}

function isMovie(item: Movie | MovieCollection): item is Movie {
  // Movie items (from OPhim list/detail endpoints) carry MongoDB `_id`;
  // MovieCollection (from Firestore) uses `id` instead.
  return (item as Movie)._id !== undefined;
}
