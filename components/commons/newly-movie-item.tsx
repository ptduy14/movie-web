'use client';

import { Link } from 'i18n/routing';
import { useLocale } from 'next-intl';
import Movie from 'types/movie';
import NewlyMovie from 'types/newly-movie';
import Image from 'next/image';
import RatingBadge from './badges/rating-badge';
import QualityLangBadge from './badges/quality-lang-badge';
import ExclusiveBadge from './badges/exclusive-badge';
import NewUpdateBadge from './badges/new-update-badge';
import MovieCardOverlay from './movie-card-overlay';
import { preferredTitle, secondaryTitle } from 'constants/i18n-mappings';
import type { Locale } from 'i18n/routing';

export default function NewlyMovieItem({ movie }: { movie: NewlyMovie | Movie }) {
  const locale = useLocale() as Locale;
  // For non-vi: use origin_name as the visible primary title (already in the
  // source language for most movies). Avoids spending Groq quota on titles.
  const primaryTitle = preferredTitle(movie.name, movie.origin_name, locale);
  const subTitle = secondaryTitle(movie.name, movie.origin_name, locale);

  return (
    <Link className="group block h-auto space-y-2" href={`/movies/${movie.slug}`}>
      {/*
        `isolate` (CSS `isolation: isolate`) creates a stacking context scoped
        to this card. Without it, badges' z-20 / z-30 escape to the document
        root and bleed through header dropdowns (which sit at z-10).
      */}
      <div className="relative w-full aspect-[2/3] overflow-hidden rounded isolate">
        <Image
          src={process.env.NEXT_PUBLIC_IMG_DOMAIN + movie.thumb_url}
          fill={true}
          alt={movie.name}
          sizes="100%"
        />

        {/* Top-left: Exclusive or NEW */}
        <div className="absolute top-1.5 left-1.5 z-20 flex flex-col gap-1">
          {movie.sub_docquyen ? (
            <ExclusiveBadge />
          ) : (
            <NewUpdateBadge modifiedAt={movie.modified?.time} />
          )}
        </div>

        {/* Top-right: quality + lang */}
        <div className="absolute top-1.5 right-1.5 z-20">
          <QualityLangBadge quality={movie.quality} lang={movie.lang} />
        </div>

        {/*
          Bottom rating — fade out 300ms AFTER hover starts so it cross-fades
          in sync with the overlay (which has a matching enter delay). Fades
          out instantly on mouseout for snappy feel.
        */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-1.5 py-1.5 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 group-hover:opacity-0 group-hover:delay-300">
          <RatingBadge imdb={movie.imdb} tmdb={movie.tmdb} />
        </div>

        {/* Hover info overlay — fade in from bottom on this card only */}
        <MovieCardOverlay
          name={primaryTitle}
          year={movie.year}
          episodeCurrent={movie.episode_current}
          categories={movie.category}
          countries={movie.country}
          time={movie.time}
          imdb={movie.imdb}
          tmdb={movie.tmdb}
          collectionItem={{
            id: movie._id,
            slug: movie.slug,
            thumb_url: movie.thumb_url,
            name: movie.name,
            origin_name: movie.origin_name,
            lang: movie.lang ?? '',
            quality: movie.quality ?? '',
          }}
        />
      </div>

      <div>
        <div className="truncate">{primaryTitle}</div>
        {subTitle && <div className="truncate text-sm text-[#9B9285]">{subTitle}</div>}
      </div>
    </Link>
  );
}
