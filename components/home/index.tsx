import HeroSection from './hero-section';
import MovieList from '../commons/movie-list';
import MovieServices from 'services/movie-services';
import DailyUpdateBanner from './daily-update-banner';
import ContinueWatchingSection from './continue-watching-section';
import TrendingSection from './trending-section';
import { getTranslations, getLocale } from 'next-intl/server';
import { localizedCategory } from 'constants/i18n-mappings';
import type { Locale } from 'i18n/routing';

// Genre discovery rows on the home page (Netflix-style browse-by-genre).
// Slugs map to OPhim `/v1/api/the-loai/<slug>` and to localizedCategory().
const GENRE_ROW_SLUGS = ['hanh-dong', 'tinh-cam', 'kinh-di'];

export default async function HomePage() {
  const t = await getTranslations('home.lists');
  const locale = (await getLocale()) as Locale;

  const newlyMoviesFetcher = MovieServices.getNewlyMovies();
  const singleMoviesFetcher = MovieServices.getSingleMovies();
  const tvSeriesFetcher = MovieServices.getTVSeries();
  const cartoonMoviesFetcher = MovieServices.getCartoonMovies();
  const tvShowsFetcher = MovieServices.getTVShows();
  // Per-genre fetch is best-effort: a failure must not break the whole page,
  // so each is caught to null and its row is skipped when empty.
  const genreFetchers = GENRE_ROW_SLUGS.map((slug) =>
    MovieServices.getMoviesType(slug, 1).catch(() => null)
  );

  // will improve later with Promise.settled()
  const [newlyMovies, singleMovies, tvSeries, cartoonMovies, tvShows, ...genreResults] =
    await Promise.all([
      newlyMoviesFetcher,
      singleMoviesFetcher,
      tvSeriesFetcher,
      cartoonMoviesFetcher,
      tvShowsFetcher,
      ...genreFetchers,
    ]);

  // /v1/api/home now returns response wrapped in `data` (consistent with other v1 endpoints)
  const newlyItems = newlyMovies?.data?.items ?? [];
  const itemsUpdateInDay = newlyMovies?.data?.params?.itemsUpdateInDay ?? 0;
  const totalLibrary = newlyMovies?.data?.params?.pagination?.totalItems ?? 0;

  return (
    <div className="h-full">
      <HeroSection movies={newlyItems.slice(0, 5)} />
      <DailyUpdateBanner count={itemsUpdateInDay} totalLibrary={totalLibrary} />
      <div className="space-y-8">
        <ContinueWatchingSection />
        <TrendingSection />
        <MovieList listName={t('newlyUpdated')} movies={newlyItems} isNewlyMovieItem={true} />
        <MovieList
          movies={singleMovies.data.items.slice(0, 10)}
          listName={t('singleNewlyUpdated')}
          isNewlyMovieItem={false}
        />
        <MovieList
          movies={tvSeries.data.items.slice(0, 10)}
          listName={t('tvSeriesNewlyUpdated')}
          isNewlyMovieItem={false}
        />
        <MovieList
          movies={cartoonMovies.data.items.slice(0, 10)}
          listName={t('cartoonNewlyUpdated')}
          isNewlyMovieItem={false}
        />
        <MovieList
          movies={tvShows.data.items.slice(0, 10)}
          listName={t('tvShowsNewlyUpdated')}
          isNewlyMovieItem={false}
        />

        {/* Browse-by-genre discovery rows */}
        {GENRE_ROW_SLUGS.map((slug, i) => {
          const items = genreResults[i]?.data?.items ?? [];
          if (items.length === 0) return null;
          return (
            <MovieList
              key={slug}
              movies={items.slice(0, 10)}
              listName={localizedCategory(slug, locale)}
              isNewlyMovieItem={false}
            />
          );
        })}
      </div>
    </div>
  );
}
