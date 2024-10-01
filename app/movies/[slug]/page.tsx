import MoviePage from '@/components/movie';
import MovieServices from 'services/movie-services';
import { redirect } from 'next/navigation';
import TMDBServices from 'services/tmdb-services';
import { Metadata } from 'next';
import DetailMovie from 'types/detail-movie';
import PageParams from 'types/page-params';

let movie: DetailMovie;

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  try {
    const res = await MovieServices.getDetailMovie(params.slug);
    if (!res.status) throw new Error("");
    movie = res;
  } catch (error) {
    redirect('/');
  }

  return {
    title: movie.movie.name,
    description: movie.movie.content,
  };
}

export default async function Movie({ params }: PageParams) {
  const movie = await MovieServices.getDetailMovie(params.slug);

  let credit;

  if (movie.movie.tmdb.id !== '') {
    try {
      credit = await TMDBServices.getCredits(movie.movie.tmdb.id, movie.movie.tmdb.type);
    } catch (error) {
      redirect('/')
    }
  }

  return <MoviePage movie={movie} credit={credit} />;
}
