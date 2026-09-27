import MovieWatchPage from '@/components/watch';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getTitleDetail } from 'services/catalog-service';
import { getLocalizedMovieContent } from 'services/movie-content-localizer';

interface WatchPageParams {
  params: { locale: string; slug: string };
}

/**
 * Watch-page metadata.
 *
 * Shares the title fetch with the page component via Next's request cache, so
 * this costs no extra upstream call.
 */
export async function generateMetadata({ params }: WatchPageParams): Promise<Metadata> {
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

export default async function MovieWatch({ params }: WatchPageParams) {
  setRequestLocale(params.locale);

  const movie = await getTitleDetail(params.slug, params.locale);

  if (!movie) {
    redirect(`/${params.locale}`);
  }

  // Unreleased titles have a TMDB entry but nothing to play. Send them to the
  // detail page, which can still show the synopsis and trailer.
  const hasPlayableEpisode = movie.episodes.some((season) =>
    season.server_data.some((ep) => Boolean(ep.link_embed))
  );
  if (!hasPlayableEpisode) {
    redirect(`/${params.locale}/movies/${params.slug}`);
  }

  return <MovieWatchPage movie={movie} />;
}
