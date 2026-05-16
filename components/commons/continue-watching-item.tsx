'use client';

import Image from 'next/image';
import { Link } from 'i18n/routing';
import { useLocale } from 'next-intl';
import type { IRecentMovie } from 'types/recent-movie';
import { preferredTitle, secondaryTitle } from 'constants/i18n-mappings';
import type { Locale } from 'i18n/routing';
import QualityLangBadge from './badges/quality-lang-badge';
import AddToCollectionOverlayBtn from './add-to-collection-overlay-btn';

/**
 * "Continue Watching" card. Differs from `NewlyMovieItem`:
 *  - Uses `thumb_url` (landscape 16:9) instead of poster (2:3) — user request,
 *    keeps the carousel visually distinct from the rest of the home rows.
 *  - Renders a thin red progress bar at the bottom of the thumbnail when we
 *    have both `progressTime` and `progressDuration`. Bar is omitted (not
 *    rendered as 0%) for legacy entries with no duration to avoid showing a
 *    misleading "untouched" state.
 *  - Links to `/movies/watch/{slug}` (not the detail page). The watch page's
 *    existing `useVideoProgress` hook detects stored progress and prompts to
 *    resume — no need to encode position/episode in the URL.
 *  - Top-right shows quality+lang chip (same data the hero/detail pages
 *    already render) so the user can tell at a glance whether they'll
 *    resume an HD Vietsub vs a Lồng Tiếng episode.
 *  - Top-left reveals the add-to-collection button on hover, matching the
 *    interaction model from `NewlyMovieItem`. Guests get the auth modal.
 */
export default function ContinueWatchingItem({ movie }: { movie: IRecentMovie }) {
  const locale = useLocale() as Locale;
  const primaryTitle = preferredTitle(movie.name, movie.origin_name, locale);
  const subTitle = secondaryTitle(movie.name, movie.origin_name, locale);

  const hasProgress =
    typeof movie.progressTime === 'number' &&
    typeof movie.progressDuration === 'number' &&
    movie.progressDuration > 0;
  // Clamp to [0, 100] — guards against rare cases where `progressTime` exceeds
  // `progressDuration` (e.g., episode changed between save and read, or the
  // user scrubbed past the end).
  const progressPct = hasProgress
    ? Math.min(100, Math.max(0, (movie.progressTime! / movie.progressDuration!) * 100))
    : 0;

  // Firestore entries store the OPhim CDN path in `thumb_url` (relative, no
  // host) for backwards compatibility. Prefix with the configured image
  // domain when the value doesn't already look like an absolute URL.
  const thumbSrc = movie.thumb_url.startsWith('http')
    ? movie.thumb_url
    : `${process.env.NEXT_PUBLIC_IMG_DOMAIN}${movie.thumb_url}`;

  return (
    <Link
      className="group block h-auto space-y-2"
      href={`/movies/watch/${movie.slug}`}
    >
      {/*
        `isolate` (CSS `isolation: isolate`) scopes the z-index stacking to
        this card so overlay badges (z-20) don't escape into the document
        root and bleed through header dropdowns (matches NewlyMovieItem).
      */}
      <div className="relative w-full aspect-video overflow-hidden rounded isolate">
        <Image
          src={thumbSrc}
          fill
          alt={primaryTitle}
          sizes="(max-width: 768px) 50vw, 20vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />

        {/* Top-right: quality + lang chip */}
        <div className="absolute top-1.5 right-1.5 z-20">
          <QualityLangBadge quality={movie.quality} lang={movie.lang} />
        </div>

        {/*
          Top-left: add-to-collection — fade in on hover only so the resting
          card stays clean. `pointer-events-none` on the wrapper + the button's
          own `pointer-events-auto` keeps the underlying <Link> clickable
          everywhere else on the card.
        */}
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
            <div
              className="h-full bg-[#e20913]"
              style={{ width: `${progressPct}%` }}
            />
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
