import type { Metadata } from 'next';
import { browseMetadata } from 'lib/browse-metadata';
import MovieTypePage from '@/components/move-type';
import { notFound, permanentRedirect } from 'next/navigation';
import { LEGACY_GENRE_REDIRECTS, isBrowsableGenre } from 'constants/catalog-taxonomy';
import { queryString } from 'utils/query-string';

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  return browseMetadata('genre', params.slug, params.locale);
}

export default function MovieType({
  params,
  searchParams,
}: {
  params: { locale: string; slug: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const legacy = LEGACY_GENRE_REDIRECTS[params.slug];
  if (legacy) {
    permanentRedirect(`/${params.locale}/movies/type/${legacy}${queryString(searchParams)}`);
  }
  // Unknown slugs and hidden genres (phim-18) are not pages.
  if (!isBrowsableGenre(params.slug)) notFound();

  return <MovieTypePage slug={params.slug} />;
}
