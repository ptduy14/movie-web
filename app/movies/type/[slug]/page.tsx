import MovieTypePage from '@/components/move-type';
import PageParams from 'types/page-params';
import movieType from 'data/movie-type';

export async function generateMetadata({ params }: PageParams) {
  const type = movieType.find((type) => type.slug === params.slug);

  return {
    title: `Phim ${type ? type.name : ''} Mới 2024 - Cập Nhật Hôm Nay Phim Hay Hot Nhất`,
    description: `Phim ${
      type ? type.name : ''
    } đáng xem nhất thời điểm hiện tại hay nhất được tuyển chọn kho phim đặc sắc hot`,
  };
}

export default function MovieType({ params }: { params: { slug: string } }) {
  return <MovieTypePage slug={params.slug} />;
}
