import HeroSection from './hero-section';
import MovieList from '../commons/movie-list';
import MovieServices from 'services/movie-services';
import DailyUpdateBanner from './daily-update-banner';
import ContinueWatchingSection from './continue-watching-section';
import TrendingSection from './trending-section';
import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const t = await getTranslations('home.lists');

  const newlyMoviesFetcher = MovieServices.getNewlyMovies();
  const singleMoviesFetcher = MovieServices.getSingleMovies();
  const tvSeriesFetcher = MovieServices.getTVSeries();
  const cartoonMoviesFetcher = MovieServices.getCartoonMovies();
  const tvShowsFetcher = MovieServices.getTVShows();

  // will improve later with Promise.settled()
  const [newlyMovies, singleMovies, tvSeries, cartoonMovies, tvShows] = await Promise.all([
    newlyMoviesFetcher,
    singleMoviesFetcher,
    tvSeriesFetcher,
    cartoonMoviesFetcher,
    tvShowsFetcher,
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
      </div>
    </div>
  );
}
