'use client';

import Image from 'next/image';
import { Link } from 'i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { IoClose } from 'react-icons/io5';
import type { IRecentMovie } from 'types/recent-movie';
import { preferredTitle, secondaryTitle } from 'constants/i18n-mappings';
import type { Locale } from 'i18n/routing';
import QualityLangBadge from './badges/quality-lang-badge';
import AddToCollectionOverlayBtn from './add-to-collection-overlay-btn';

interface ContinueWatchingItemProps {
  movie: IRecentMovie;
  /** `'watch'` deep-links to player; `'detail'` opens the movie detail page. */
  target?: 'watch' | 'detail';
  /** When provided, an X button swaps in for the quality badge on hover. */
  onDelete?: (movieId: string) => void;
}

export default function ContinueWatchingItem({
  movie,
  target = 'watch',
  onDelete,
}: ContinueWatchingItemProps) {
  const locale = useLocale() as Locale;
  const tCard = useTranslations('card');
  const primaryTitle = preferredTitle(movie.name, movie.origin_name, locale);
  const subTitle = secondaryTitle(movie.name, movie.origin_name, locale);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(movie.id);
  };

  const hasProgress =
    typeof movie.progressTime === 'number' &&
    typeof movie.progressDuration === 'number' &&
    movie.progressDuration > 0;
  const progressPct = hasProgress
    ? Math.min(100, Math.max(0, (movie.progressTime! / movie.progressDuration!) * 100))
    : 0;

  const thumbSrc = movie.thumb_url.startsWith('http')
    ? movie.thumb_url
    : `${process.env.NEXT_PUBLIC_IMG_DOMAIN}${movie.thumb_url}`;

  return (
    <Link
      className="group block h-auto space-y-2 select-none"
      href={target === 'detail' ? `/movies/${movie.slug}` : `/movies/watch/${movie.slug}`}
    >
      <div className="relative w-full aspect-video overflow-hidden rounded isolate">
        <Image
          src={thumbSrc}
          fill
          alt={primaryTitle}
          sizes="(max-width: 768px) 50vw, 20vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />

        <div
          className={`absolute top-1.5 right-1.5 z-20 transition-opacity duration-200 ${
            onDelete ? 'group-hover:opacity-0 pointer-events-none' : ''
          }`}
        >
          <QualityLangBadge quality={movie.quality} lang={movie.lang} />
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            aria-label={tCard('removeFromRecent')}
            title={tCard('removeFromRecent')}
            className="absolute top-1.5 right-1.5 z-20 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-black/60 hover:bg-red-600 backdrop-blur-sm"
          >
            <IoClose className="text-white text-base md:text-lg" />
          </button>
        )}

        <div className="absolute top-1.5 left-1.5 z-20 opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none">
          <AddToCollectionOverlayBtn
            collectionItem={{
              id: movie.id,
              slug: movie.slug,
              thumb_url: movie.thumb_url,
              name: movie.name,
              origin_name: movie.origin_name,
              lang: movie.lang,
              quality: movie.quality,
            }}
          />
        </div>

        {hasProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
            <div className="h-full bg-[#e20913]" style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </div>

      <div>
        <div className="truncate text-sm font-semibold">{primaryTitle}</div>
        {subTitle && <div className="truncate text-xs text-[#9B9285]">{subTitle}</div>}
      </div>
    </Link>
  );
}
