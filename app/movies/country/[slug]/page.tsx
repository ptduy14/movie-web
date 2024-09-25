import MovieCountryPage from '@/components/movie-country';
import { Metadata } from 'next';
import PageParams from 'types/page-params';
import countries from 'data/countries';

export async function generateMetadata({ params }: PageParams) {
  const country = countries.find((country) => country.slug === params.slug);

  return {
    title: `Phim ${country ? country.name : ''} Mới 2024 - Cập Nhật Hôm Nay Phim Hay Hot Nhất`,
    description: `Phim ${
      country ? country.name : ''
    } đáng xem nhất thời điểm hiện tại hay nhất được tuyển chọn kho phim đặc sắc hot`,
  };
}

export default function MovieCountry({ params }: { params: { slug: string } }) {
  return <MovieCountryPage slug={params.slug} />;
}
