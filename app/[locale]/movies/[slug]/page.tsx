import MoviePage from '@/components/movie';
import { permanentRedirect, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { getLocalizedMovieContent } from 'services/movie-content-localizer';
import { preferredTitle } from 'constants/i18n-mappings';
import { fetchMovieLogoUrl } from 'utils/tmdb-logo';
import {
  getTitleDetail,
  getRelatedTitles,
  getOtherSeasons,
  getTitleExtras,
} from 'services/catalog-service';
import type { Locale } from 'i18n/routing';

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

    return {
      title: preferredTitle(detail.movie.name, detail.movie.origin_name, params.locale as Locale),
      description,
    };
  } catch {
    return { title: 'Movie' };
  }
}

export default async function Movie({ params }: MoviePageParams) {
  setRequestLocale(params.locale);

  const movie = await getTitleDetail(params.slug, params.locale);

  // A slug that resolves to nothing. Anything else (a timeout, a 5xx) throws
  // out of `getTitleDetail` and reaches the error boundary instead of
  // silently pretending the title doesn't exist.
  if (!movie) {
    redirect(`/${params.locale}`);
  }

  // A v2.0.0 slug (`…-tv-1399`) resolved through its TMDB id. Send the
  // visitor — and search engines — to the canonical catalog URL.
  if (movie.movie.slug !== params.slug) {
    permanentRedirect(`/${params.locale}/movies/${movie.movie.slug}`);
  }

  // Kicked off together so the slow ones overlap. All best-effort: each
  // failure just hides its section.
  const [relatedMovies, seasons, extras, logoUrl] = await Promise.all([
    getRelatedTitles(movie, params.locale),
    getOtherSeasons(movie),
    getTitleExtras(movie.movie.slug),
    fetchMovieLogoUrl(movie.movie.tmdb, params.locale as Locale),
  ]);

  // The catalog writes every synopsis in Vietnamese, so on any other locale this
  // is machine translation and the reader deserves to be told.
  // Header image: TMDB's primary backdrop (set by enrichment); failing that,
  // the first wide textless still from the gallery we already loaded.
  if (!movie.movie.tmdb_backdrop) {
    const still = extras.images.find((img) => !img.iso_639_1 && img.width >= 1280);
    if (still) movie.movie.tmdb_backdrop = still.file_path;
  }

  const aiTranslated = Boolean(movie.movie.content) && movie.movie.content_lang !== params.locale;

  if (movie.movie.content) {
    movie.movie.content = await getLocalizedMovieContent(
      movie.movie._id,
      params.locale,
      movie.movie.content,
      movie.movie.content_lang
    );
  }

  return (
    <MoviePage
      movie={movie}
      credit={extras.credit}
      images={extras.images}
      logoUrl={logoUrl}
      relatedMovies={relatedMovies}
      seasons={seasons}
      aiTranslated={aiTranslated}
    />
  );
}
