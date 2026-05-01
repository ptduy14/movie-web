import MoviePage from '@/components/movie';
import MovieServices from 'services/movie-services';
import TMDBServices from 'services/tmdb-services';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

interface MoviePageParams {
  params: { locale: string; slug: string };
}

/**
 * Build metadata for a movie detail page.
 *
 * IMPORTANT: do NOT use module-level state here. App Router runs this
 * concurrently across requests, and module-level vars get clobbered between
 * concurrent renders, causing wrong metadata or null reads.
 */
export async function generateMetadata({ params }: MoviePageParams): Promise<Metadata> {
  try {
    const res = await MovieServices.getDetailMovie(params.slug);
    if (!res?.status) {
      return { title: 'Movie not found' };
    }
    return {
      title: res.movie?.name,
      description: res.movie?.content,
    };
  } catch {
    return { title: 'Movie' };
  }
}

export default async function Movie({ params }: MoviePageParams) {
  setRequestLocale(params.locale);
  const movie = await MovieServices.getDetailMovie(params.slug);

  // Defensive: bad slug or API failure → redirect home (locale-aware via middleware)
  if (!movie?.status || !movie?.movie) {
    redirect(`/${params.locale}`);
  }

  const res = await MovieServices.getMovieImages(params.slug);

  let credit;
  if (movie.movie.tmdb?.id) {
    try {
      credit = await TMDBServices.getCredits(movie.movie.tmdb.id, movie.movie.tmdb.type);
    } catch {
      // Non-fatal: detail page still renders without TMDB credits
      credit = undefined;
    }
  }

  return <MoviePage movie={movie} credit={credit} images={res?.data?.images ?? []} />;
}
