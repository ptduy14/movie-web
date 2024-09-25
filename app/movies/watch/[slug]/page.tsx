import MovieWatchPage from '@/components/watch';
import MovieServices from 'services/movie-services';
import DetailMovie from 'types/detail-movie';
import { Metadata } from 'next';
import PageParams from 'types/page-params';
import { redirect } from 'next/navigation';

let movie: DetailMovie;

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  try {
    const res = await MovieServices.getDetailMovie(params.slug);
    movie = res;
  } catch (error) {
    redirect('/');
  }

  return {
    title: `Xem Phim ${movie.movie.name}`,
    description: movie.movie.content,
  };
}

export default async function MovieWatch({ params }: { params: { slug: string } }) {
  const movie = await MovieServices.getDetailMovie(params.slug);

  return <MovieWatchPage movie={movie} />;
}
