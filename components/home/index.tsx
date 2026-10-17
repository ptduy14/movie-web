import HeroSection from './hero-section';
import MovieList from '../commons/movie-list';
import DailyUpdateBanner from './daily-update-banner';
import ContinueWatchingSection from './continue-watching-section';
import BecauseYouWatchedSection from './because-you-watched-section';
import TrendingSection from './trending-section';
import { getTranslations, getLocale } from 'next-intl/server';
import { localizedCategory } from 'constants/i18n-mappings';
import {
  getNewlyAddedFeed,
  getFormatRail,
  getGenreRail,
  getTrendingRail,
} from 'services/catalog-service';
import type { Locale } from 'i18n/routing';

// Browse-by-genre rails, Netflix style. Slugs come from the catalog taxonomy
// and double as the link target (`/movies/type/<slug>`).
const GENRE_ROW_SLUGS = ['hanh-dong', 'tinh-cam', 'kinh-di'];

export default async function HomePage() {
  const t = await getTranslations('home.lists');
  const locale = (await getLocale()) as Locale;

  // `Promise.all` is safe here ONLY because every one of these resolves to
  // an empty value on failure rather than rejecting — see `safeRail` in the
  // catalog service. One upstream hiccup must cost one rail, not the page.
  const [
    latest,
    hero,
    theatrical,
    singleMovies,
    tvSeries,
    cartoonMovies,
    voiced,
    tvShows,
    ...genreResults
  ] = await Promise.all([
    getNewlyAddedFeed(locale),
    getTrendingRail(locale, 5),
    getFormatRail('phim-chieu-rap', locale),
    getFormatRail('phim-le', locale),
    getFormatRail('phim-bo', locale),
    getFormatRail('hoat-hinh', locale),
    getFormatRail('phim-thuyet-minh', locale),
    getFormatRail('tv-shows', locale),
    ...GENRE_ROW_SLUGS.map((slug) => getGenreRail(slug, locale)),
  ]);
  const newlyAdded = latest.items;

  // Trending already falls back to theatrical releases on its own; this
  // second fallback only matters when the catalog itself is down.
  const heroMovies = (hero.length > 0 ? hero : newlyAdded).slice(0, 5);

  // The catalog reports the real "updated today" count for the whole catalog —
  // counting the rail's 14 rows would cap the banner at 14.
  const addedTodayCount = latest.updatedToday;

  return (
    <div className="h-full">
      <HeroSection movies={heroMovies} />
      <DailyUpdateBanner count={addedTodayCount} />
      <div className="space-y-8">
        <ContinueWatchingSection />
        <BecauseYouWatchedSection />
        <TrendingSection />
        {newlyAdded.length > 0 && (
          <MovieList listName={t('newlyUpdated')} movies={newlyAdded} isNewlyMovieItem={true} />
        )}
        {theatrical.length > 0 && (
          <MovieList
            movies={theatrical}
            listName={t('theatricalNewlyUpdated')}
            isNewlyMovieItem={false}
          />
        )}
        {singleMovies.length > 0 && (
          <MovieList
            movies={singleMovies}
            listName={t('singleNewlyUpdated')}
            isNewlyMovieItem={false}
          />
        )}
        {tvSeries.length > 0 && (
          <MovieList
            movies={tvSeries}
            listName={t('tvSeriesNewlyUpdated')}
            isNewlyMovieItem={false}
          />
        )}
        {cartoonMovies.length > 0 && (
          <MovieList
            movies={cartoonMovies}
            listName={t('cartoonNewlyUpdated')}
            isNewlyMovieItem={false}
          />
        )}
        {voiced.length > 0 && (
          <MovieList
            movies={voiced}
            listName={t('voicedNewlyUpdated')}
            isNewlyMovieItem={false}
          />
        )}
        {tvShows.length > 0 && (
          <MovieList
            movies={tvShows}
            listName={t('tvShowsNewlyUpdated')}
            isNewlyMovieItem={false}
          />
        )}

        {/* Browse-by-genre discovery rows */}
        {GENRE_ROW_SLUGS.map((slug, i) => {
          const items = genreResults[i] ?? [];
          if (items.length === 0) return null;
          return (
            <MovieList
              key={slug}
              movies={items}
              listName={localizedCategory(slug, locale)}
              isNewlyMovieItem={false}
            />
          );
        })}
      </div>
    </div>
  );
}
