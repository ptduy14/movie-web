import MovieWatchPage from '@/components/watch';
import { Metadata } from 'next';
import { permanentRedirect, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getTitleDetail } from 'services/catalog-service';
import { getLocalizedMovieContent } from 'services/movie-content-localizer';
import { preferredTitle } from 'constants/i18n-mappings';
import type { Locale } from 'i18n/routing';

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

    return {
      title: preferredTitle(detail.movie.name, detail.movie.origin_name, params.locale as Locale),
      description,
    };
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

  if (movie.movie.slug !== params.slug) {
    permanentRedirect(`/${params.locale}/movies/watch/${movie.movie.slug}`);
  }

  // Trailers and not-yet-uploaded titles have nothing to play: no catalog
  // stream and no backup address. The detail page can still show the
  // synopsis and trailer.
  const hasPlayableEpisode = movie.episodes.some((server) =>
    server.server_data.some((ep) => Boolean(ep.link_m3u8 || ep.link_embed))
  );
  if (!hasPlayableEpisode) {
    redirect(`/${params.locale}/movies/${movie.movie.slug}`);
  }

  return <MovieWatchPage movie={movie} />;
}
