import MovieCountryPage from '@/components/movie-country';
import { Metadata } from 'next';
import PageParams from 'types/page-params';
import countries from 'data/countries';
import { notFound, permanentRedirect } from 'next/navigation';
import { LEGACY_COUNTRY_REDIRECTS, isKnownCountry } from 'constants/catalog-taxonomy';
import { queryString } from 'utils/query-string';

export async function generateMetadata({ params }: PageParams) {
  const country = countries.find((country) => country.slug === params.slug);

  return {
    title: `Phim ${country ? country.name : ''} Mới 2024 - Cập Nhật Hôm Nay Phim Hay Hot Nhất`,
    description: `Phim ${
      country ? country.name : ''
    } đáng xem nhất thời điểm hiện tại hay nhất được tuyển chọn kho phim đặc sắc hot`,
  };
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
