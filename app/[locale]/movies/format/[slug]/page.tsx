import MovieFormatPage from "@/components/movie-format"
import PageParams from "types/page-params";
import movieFormat from "data/move-format";

export async function generateMetadata({ params }: PageParams) {
    const format = movieFormat.find((format) => format.slug === params.slug);
  
    return {
      title: `Phim ${format ? format.name : ''} Mới 2024 - Cập Nhật Hôm Nay Phim Hay Hot Nhất`,
      description: `Phim ${
        format ? format.name : ''
      } đáng xem nhất thời điểm hiện tại hay nhất được tuyển chọn kho phim đặc sắc hot`,
    };
  }

export default function MovieFormat({ params } : {params: {slug: string}}) {
    
    return <MovieFormatPage slug={params.slug}/>
}