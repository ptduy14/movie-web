import MovieFormatPage from "@/components/movie-format"
import PageParams from "types/page-params";
import movieFormat from "data/move-format";
import { notFound } from 'next/navigation';
import { isKnownFormat } from 'constants/catalog-taxonomy';
import { FORMAT_MAP } from 'constants/i18n-mappings';

export async function generateMetadata({ params }: PageParams) {
    const format = movieFormat.find((format) => format.slug === params.slug);
  
    return {
      title: `Phim ${format?.name ?? FORMAT_MAP.vi[params.slug] ?? ''} Mới 2024 - Cập Nhật Hôm Nay Phim Hay Hot Nhất`,
      description: `Phim ${
        format?.name ?? FORMAT_MAP.vi[params.slug] ?? ''
      } đáng xem nhất thời điểm hiện tại hay nhất được tuyển chọn kho phim đặc sắc hot`,
    };
  }

export default function MovieFormat({ params }: { params: { slug: string } }) {
  if (!isKnownFormat(params.slug)) notFound();
  return <MovieFormatPage slug={params.slug} />;
}