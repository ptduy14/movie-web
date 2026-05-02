'use client';
import { FaPlay } from 'react-icons/fa';
import { useTranslations, useLocale } from 'next-intl';
import type Category from 'types/category';
import type Country from 'types/country';
import type Imdb from 'types/imdb';
import type Tmdb from 'types/tmdb';
import type MovieCollection from 'types/movie-collection';
import RatingBadge from './badges/rating-badge';
import AddToCollectionOverlayBtn from './add-to-collection-overlay-btn';
import {
  localizedCategory,
  localizedCountry,
  localizedTime,
  localizedEpisodeCurrent,
} from 'constants/i18n-mappings';
import type { Locale } from 'i18n/routing';

interface MovieCardOverlayProps {
  name: string;
  year?: number;
  episodeCurrent?: string;
  categories?: Category[];
  countries?: Country[];
  /** Raw duration string from OPhim, e.g. "45 phút/tập" or "117 Phút". May be "? phút/tập". */
  time?: string;
  imdb?: Imdb;
  tmdb?: Tmdb;
  /**
   * If provided, renders the "Add to collection" action button.
   * Pass `undefined` (e.g., for MovieCollection cards already in collection) to hide it.
   */
  collectionItem?: MovieCollection;
}

/**
 * Hover overlay shown on movie cards.
 *
 * UX timing:
 *  - Fade IN with a 300ms delay → avoids flicker when user quickly drags
 *    cursor across multiple cards in a row.
 *  - Fade OUT with no delay → leaves immediately on mouseout, feels snappy.
 *
 * Pointer events:
 *  - Container is `pointer-events-none` so the underlying <Link> still owns
 *    clicks for "card → detail" navigation.
 *  - Action buttons opt back in via `pointer-events-auto` and intercept events.
 */
export default function MovieCardOverlay({
  name,
  year,
  episodeCurrent,
  categories,
  countries,
  time,
  imdb,
  tmdb,
  collectionItem,
}: MovieCardOverlayProps) {
  const t = useTranslations('card');
  const locale = useLocale() as Locale;
  // Build metadata items, skipping empty/invalid values.
  // `time` and `episodeCurrent` are pattern-localized — no Gemini call needed.
  const meta: string[] = [];
  if (year) meta.push(String(year));
  const firstCountrySlug = countries?.[0]?.slug;
  if (firstCountrySlug) meta.push(localizedCountry(firstCountrySlug, locale));
  if (time && !time.startsWith('?')) meta.push(localizedTime(time, locale));
  if (episodeCurrent) meta.push(localizedEpisodeCurrent(episodeCurrent, locale));

  return (
    <div
      className={[
        'absolute inset-0 z-30 flex flex-col justify-end p-2.5 md:p-3 pointer-events-none',
        'bg-gradient-to-t from-black via-black/85 to-transparent',
        // Fade in (300ms duration + 300ms delay), fade out instantly (delay-0).
        'opacity-0 transition-opacity duration-300',
        'group-hover:opacity-100 group-hover:delay-300',
      ].join(' ')}
    >
      <div className="space-y-1.5">
        {/* Title */}
        <div className="text-xs md:text-sm font-bold text-white line-clamp-2 leading-snug">
          {name}
        </div>

        {/* Metadata row: year • country • duration • episode */}
        {meta.length > 0 && (
          <div className="flex items-center gap-x-1.5 text-[10px] md:text-xs text-white/80 flex-wrap">
            {meta.map((item, i) => (
              <span key={i} className="flex items-center gap-x-1.5">
                {i > 0 && <span className="text-white/40">•</span>}
                <span className="line-clamp-1">{item}</span>
              </span>
            ))}
          </div>
        )}

        {/* Ratings — RatingBadge auto-hides when no valid scores */}
        <RatingBadge imdb={imdb} tmdb={tmdb} />

        {/* Top 2 category chips */}
        {categories && categories.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {categories.slice(0, 2).map((c) => (
              <span
                key={c.slug}
                className="text-[9px] md:text-[10px] px-1.5 py-0.5 bg-white/15 backdrop-blur-sm rounded text-white/90"
              >
                {localizedCategory(c.slug, locale)}
              </span>
            ))}
          </div>
        )}

        {/* Action row: Xem ngay + Add to collection */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-[11px] md:text-xs font-bold text-red-400">
            <FaPlay className="text-[9px] md:text-[10px]" />
            <span>{t('watchNow')}</span>
          </div>
          {collectionItem && <AddToCollectionOverlayBtn collectionItem={collectionItem} />}
        </div>
      </div>
    </div>
  );
}
