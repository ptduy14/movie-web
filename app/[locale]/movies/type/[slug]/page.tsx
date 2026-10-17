import MovieTypePage from '@/components/move-type';
import PageParams from 'types/page-params';
import movieType from 'data/movie-type';
import { notFound, permanentRedirect } from 'next/navigation';
import { LEGACY_GENRE_REDIRECTS, isBrowsableGenre } from 'constants/catalog-taxonomy';
import { queryString } from 'utils/query-string';

export async function generateMetadata({ params }: PageParams) {
  const type = movieType.find((type) => type.slug === params.slug);

  return {
    title: `Phim ${type ? type.name : ''} Mới 2024 - Cập Nhật Hôm Nay Phim Hay Hot Nhất`,
    description: `Phim ${
      type ? type.name : ''
    } đáng xem nhất thời điểm hiện tại hay nhất được tuyển chọn kho phim đặc sắc hot`,
  };
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
