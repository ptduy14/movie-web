'use client';

import { Link } from 'i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { localizedCategory } from 'constants/i18n-mappings';
import type { Locale } from 'i18n/routing';
import { FaFilm } from 'react-icons/fa';
import { MdSearchOff } from 'react-icons/md';

/** Minimal shape for the suggestion row — baked from trending.json server-side. */
export type SearchSuggestion = {
  slug: string;
  title: string;
  poster_url: string;
};

// Popular genres surfaced for browse-by-genre. Slugs map to
// /movies/type/<slug> and to localizedCategory().
const GENRE_SLUGS = [
  'hanh-dong',
  'tinh-cam',
  'kinh-di',
  'hai-huoc',
  'co-trang',
  'vien-tuong',
  'tam-ly',
  'hinh-su',
];

/**
 * Search discovery surface — replaces the old shared "MOVIEX" placeholder.
 * Renders two distinct states:
 *  - initial (no `query`): a prompt + browse-by-genre + trending row
 *  - zero-results (`query` set): a clear "no results for X" message + the same
 *    genre/suggestion fallbacks so the user keeps discovering (Netflix-style).
 */
export default function SearchDiscovery({
  query,
  suggestions,
}: {
  query?: string;
  suggestions: SearchSuggestion[];
}) {
  const t = useTranslations('search');
  const locale = useLocale() as Locale;
  const isNoResults = Boolean(query && query.trim());

  return (
    <div className="mt-8 space-y-10 pb-10 lg:mt-12">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-muted text-brand">
          {isNoResults ? <MdSearchOff size={28} /> : <FaFilm size={26} />}
        </div>
        <h2 className="text-lg font-semibold text-white lg:text-xl">
          {isNoResults ? t('noResultsTitle', { query: query!.trim() }) : t('promptTitle')}
        </h2>
        <p className="max-w-md text-sm text-gray-400">
          {isNoResults ? t('noResultsSubtitle') : t('promptSubtitle')}
        </p>
      </div>

      {/* Browse by genre */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">{t('browseByGenre')}</h3>
        <div className="flex flex-wrap gap-2">
          {GENRE_SLUGS.map((slug) => (
            <Link
              key={slug}
              href={`/movies/type/${slug}`}
              className="rounded-full border border-gray-600 px-4 py-1.5 text-sm text-gray-200 transition-all duration-300 hover:border-brand hover:text-white"
            >
              {localizedCategory(slug, locale)}
            </Link>
          ))}
        </div>
      </div>

      {/* Trending / you-might-like */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">
            {isNoResults ? t('suggestions') : t('trending')}
          </h3>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 lg:gap-4">
            {suggestions.map((m) => (
              <Link key={m.slug} href={`/movies/${m.slug}`} className="group block space-y-1.5">
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.poster_url}
                    alt={m.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="truncate text-xs text-gray-300 transition-colors group-hover:text-white lg:text-sm">
                  {m.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
