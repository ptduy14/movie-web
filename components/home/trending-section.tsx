import { getLocale, getTranslations } from 'next-intl/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import TrendingSlider, { type TrendingItem } from './trending-slider';
import type { Locale } from 'i18n/routing';

interface TrendingMovie {
  slug: string;
  // Localized titles baked by scripts/fetch-trending.mjs:
  // - vi: source-API name (Vietnamese)
  // - en: TMDB official English name (null if no tmdb_id)
  title: { vi?: string; en?: string | null };
  poster_url: string | null;
  year?: number;
  tmdb_rating?: number | null;
  trending_score: number;
}

interface TrendingData {
  updated_at: string;
  interval_days: number;
  movies: TrendingMovie[];
}

async function getTrendingMovies(): Promise<TrendingMovie[]> {
  try {
    const file = await readFile(join(process.cwd(), 'public', 'data', 'trending.json'), 'utf-8');
    const data: TrendingData = JSON.parse(file);
    return data.movies;
  } catch {
    return [];
  }
}

// Locale-aware title picker. EN locale prefers TMDB English; falls back to
// Vietnamese if TMDB has no match for this title (e.g., movies without
// tmdb_id). VI locale always uses the Vietnamese source name.
function pickTitle(title: TrendingMovie['title'], locale: Locale): string {
  if (locale === 'en' && title?.en) return title.en;
  return title?.vi ?? title?.en ?? '';
}

export default async function TrendingSection() {
  const [t, locale, trendingMovies] = await Promise.all([
    getTranslations('home.trending'),
    getLocale() as Promise<Locale>,
    getTrendingMovies(),
  ]);

  // poster_url is baked into trending.json by scripts/fetch-trending.mjs
  // (TMDB poster, then thumb_url fallback). Filter first, then assign ranks
  // — so missing-poster items don't produce gaps like "1, 3, 4, 7" in the UI.
  // Cap at 9: the rank badge is single-digit only, so a two-digit "10" would
  // render clipped behind the poster (looked like "1"). Keep it single-digit.
  const items: TrendingItem[] = trendingMovies
    .filter((m): m is TrendingMovie & { poster_url: string } => Boolean(m.poster_url))
    .slice(0, 9)
    .map((m, i) => ({
      rank: i + 1,
      slug: m.slug,
      title: pickTitle(m.title, locale),
      poster_url: m.poster_url,
      year: m.year ?? 0,
      rating: m.tmdb_rating ?? 0,
    }));

  if (items.length === 0) return null;

  return (
    <div className="container-wrapper space-y-4">
      <div className="px-4 md:px-0">
        <h2 className="relative inline-block pl-4 text-xl md:text-2xl font-bold tracking-tight">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 md:h-7 bg-gradient-to-b from-red-500 to-red-700 rounded-full" />
          {t('title')}
        </h2>
      </div>

      <TrendingSlider items={items} />
    </div>
  );
}
