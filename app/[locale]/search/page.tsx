import SearchMoviePage from '@/components/search';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { SearchSuggestion } from '@/components/search/search-discovery';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('searchTitle'),
    description: t('searchTitle'),
  };
}

/**
 * Trending titles surfaced as search suggestions. Read from the same
 * build-time `trending.json` the home page uses (no runtime API call).
 * Best-effort: any failure yields an empty list (the suggestion row hides).
 */
async function getSearchSuggestions(locale: string, limit = 6): Promise<SearchSuggestion[]> {
  try {
    const file = await readFile(join(process.cwd(), 'public', 'data', 'trending.json'), 'utf-8');
    const data = JSON.parse(file);
    const movies: any[] = Array.isArray(data?.movies) ? data.movies : [];
    return movies
      .filter((m) => Boolean(m?.poster_url))
      .slice(0, limit)
      .map((m) => ({
        slug: m.slug,
        title: locale === 'en' && m.title?.en ? m.title.en : m.title?.vi ?? m.title?.en ?? '',
        poster_url: m.poster_url,
      }));
  } catch {
    return [];
  }
}

export default async function SearchMovie({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { name?: string };
}) {
  const movieName = searchParams.name || '';
  const suggestions = await getSearchSuggestions(params.locale);
  return <SearchMoviePage movieName={movieName} suggestions={suggestions} />;
}
