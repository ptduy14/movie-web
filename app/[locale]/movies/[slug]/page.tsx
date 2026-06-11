import MoviePage from '@/components/movie';
import MovieServices from 'services/movie-services';
import TMDBServices from 'services/tmdb-services';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { getLocalizedMovieContent } from 'services/movie-content-localizer';
import { fetchMovieLogoUrl } from 'utils/tmdb-logo';
import type { Locale } from 'i18n/routing';
import type Movie from 'types/movie';

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

    // Localize description (cache-aware, falls back to original on failure)
    const description = res.movie?.content
      ? await getLocalizedMovieContent(
          res.movie._id,
          params.locale,
          res.movie.content,
          res.movie.modified?.time ?? null
        )
      : undefined;

    return {
      title: res.movie?.name,
      description,
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

  // "More Like This" — same first-genre titles. Kicked off here so it runs
  // concurrently with the images/credits/logo fetches below. Best-effort:
  // any failure or a categoryless movie yields an empty list (row hidden).
  const firstCategorySlug = movie.movie.category?.[0]?.slug;
  const relatedPromise: Promise<Movie[]> = firstCategorySlug
    ? MovieServices.getMoviesType(firstCategorySlug, 1)
        .then((r) =>
          ((r?.data?.items ?? []) as Movie[])
            .filter((m) => m._id !== movie.movie._id)
            .slice(0, 12)
        )
        .catch(() => [])
    : Promise.resolve([]);

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

  // Best-effort logo lookup. Falls back to null → component renders text title.
  const logoUrl = await fetchMovieLogoUrl(movie.movie.tmdb, params.locale as Locale);

  // Localize the description into the active locale (no-op for VI, AI-translated for others)
  if (movie.movie.content) {
    movie.movie.content = await getLocalizedMovieContent(
      movie.movie._id,
      params.locale,
      movie.movie.content,
      movie.movie.modified?.time ?? null
    );
  }

  const relatedMovies = await relatedPromise;

  return (
    <MoviePage
      movie={movie}
      credit={credit}
      images={res?.data?.images ?? []}
      logoUrl={logoUrl}
      relatedMovies={relatedMovies}
    />
  );
}
