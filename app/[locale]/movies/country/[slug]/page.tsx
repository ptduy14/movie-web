import type { Metadata } from 'next';
import { browseMetadata } from 'lib/browse-metadata';
import MovieCountryPage from '@/components/movie-country';
import { notFound, permanentRedirect } from 'next/navigation';
import { LEGACY_COUNTRY_REDIRECTS, isKnownCountry } from 'constants/catalog-taxonomy';
import { queryString } from 'utils/query-string';

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  return browseMetadata('country', params.slug, params.locale);
}

export default function MovieCountry({
  params,
  searchParams,
}: {
  params: { locale: string; slug: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const legacy = LEGACY_COUNTRY_REDIRECTS[params.slug];
  if (legacy) {
    permanentRedirect(`/${params.locale}/movies/country/${legacy}${queryString(searchParams)}`);
  }
  if (!isKnownCountry(params.slug)) notFound();

  return <MovieCountryPage slug={params.slug} />;
}
