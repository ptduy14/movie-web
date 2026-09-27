import MoviePage from '@/components/movie';
import TMDBServices from 'services/tmdb-services';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { getLocalizedMovieContent } from 'services/movie-content-localizer';
import { fetchMovieLogoUrl } from 'utils/tmdb-logo';
import { getTitleDetail, getRelatedTitles } from 'services/catalog-service';
import type { Locale } from 'i18n/routing';
import type MovieImage from 'types/movie-image';

interface MoviePageParams {
  params: { locale: string; slug: string };
}

/**
 * Build metadata for a title's detail page.
 *
 * IMPORTANT: do NOT use module-level state here. App Router runs this
 * concurrently across requests, and module-level vars get clobbered between
 * concurrent renders, causing wrong metadata or null reads.
 *
 * The detail fetch is deduplicated with the page component's own fetch by
 * Next's request cache, and the synopsis lookup by React `cache()` inside
 * the localizer — so this costs no extra upstream calls.
 */
export async function generateMetadata({ params }: MoviePageParams): Promise<Metadata> {
  try {
    const detail = await getTitleDetail(params.slug, params.locale);
    if (!detail) return { title: 'Movie not found' };

    const description = detail.movie.content
      ? await getLocalizedMovieContent(
          detail.movie._id,
          params.locale,
          detail.movie.content,
          detail.movie.content_lang
        )
      : undefined;

    return { title: detail.movie.name, description };
  } catch {
    return { title: 'Movie' };
  }
}

export default async function Movie({ params }: MoviePageParams) {
  setRequestLocale(params.locale);

  const movie = await getTitleDetail(params.slug, params.locale);

  // A slug that doesn't parse, or a title TMDB no longer has. Anything else
  // (a timeout, a 5xx) throws out of `getTitleDetail` and reaches the error
  // boundary instead of silently pretending the title doesn't exist.
  if (!movie) {
    redirect(`/${params.locale}`);
  }

  // "More Like This" — kicked off here so it overlaps the credits and logo
  // lookups below. Best-effort: failures yield an empty list and hide the row.
  const relatedPromise = getRelatedTitles(movie, params.locale);

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

  // Gallery: TMDB backdrops, replacing the previous provider's /images
  // endpoint. The gallery components only read `file_path`, so the shapes are
  // compatible. An empty array hides the section.
  let images: MovieImage[] = [];
  if (movie.movie.tmdb?.id) {
    try {
      const res = await TMDBServices.getImages(movie.movie.tmdb.id, movie.movie.tmdb.type);
      images = (res.backdrops ?? []).slice(0, 12) as unknown as MovieImage[];
    } catch {
      // Gallery is decorative — a failure just hides it.
    }
  }

  // Fill in the synopsis when TMDB had no translation for this locale.
  if (movie.movie.content) {
    movie.movie.content = await getLocalizedMovieContent(
      movie.movie._id,
      params.locale,
      movie.movie.content,
      movie.movie.content_lang
    );
  }

  const relatedMovies = await relatedPromise;

  return (
    <MoviePage
      movie={movie}
      credit={credit}
      images={images}
      logoUrl={logoUrl}
      relatedMovies={relatedMovies}
    />
  );
}
