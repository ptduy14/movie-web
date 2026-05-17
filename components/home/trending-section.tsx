import { getTranslations } from 'next-intl/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import TrendingSlider, { type TrendingItem } from './trending-slider';

interface TrendingMovie {
  slug: string;
  title: string;
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

export default async function TrendingSection() {
  const [t, trendingMovies] = await Promise.all([
    getTranslations('home.trending'),
    getTrendingMovies(),
  ]);

  // poster_url is baked into trending.json by scripts/fetch-trending.mjs
  // (TMDB poster, then thumb_url fallback). Filter first, then assign ranks
  // — so missing-poster items don't produce gaps like "1, 3, 4, 7" in the UI.
  const items: TrendingItem[] = trendingMovies
    .filter((m): m is TrendingMovie & { poster_url: string } => Boolean(m.poster_url))
    .map((m, i) => ({
      rank: i + 1,
      slug: m.slug,
      title: m.title,
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
