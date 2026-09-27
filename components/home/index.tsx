import HeroSection from './hero-section';
import MovieList from '../commons/movie-list';
import DailyUpdateBanner from './daily-update-banner';
import ContinueWatchingSection from './continue-watching-section';
import BecauseYouWatchedSection from './because-you-watched-section';
import TrendingSection from './trending-section';
import { getTranslations, getLocale } from 'next-intl/server';
import { localizedCategory } from 'constants/i18n-mappings';
import {
  getNewlyAddedRail,
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

  // `Promise.all` is safe here ONLY because every one of these rails resolves
  // to [] on failure rather than rejecting — see `safeRail` in the catalog
  // service. The previous version fanned out raw fetches through
  // `Promise.all`, so a single upstream hiccup rejected the whole render and
  // the page flushed a blank 200.
  const [newlyAdded, hero, singleMovies, tvSeries, cartoonMovies, tvShows, ...genreResults] =
    await Promise.all([
      getNewlyAddedRail(locale),
      getTrendingRail(locale, 5),
      getFormatRail('phim-le', locale),
      getFormatRail('phim-bo', locale),
      getFormatRail('hoat-hinh', locale),
      getFormatRail('tv-shows', locale),
      ...GENRE_ROW_SLUGS.map((slug) => getGenreRail(slug, locale)),
    ]);

  // The hero needs five titles with artwork; trending is the best source for
  // that. Fall back to the "recently added" rail when trending is empty so
  // the page never opens on a hero-shaped hole.
  const heroMovies = (hero.length > 0 ? hero : newlyAdded).slice(0, 5);

  // The banner claims "N titles added today", so count the ones that actually
  // were. `newlyAdded.length` would just report the rail size (always 14) and
  // turn the banner into decoration that reads like data.
  const DAY_MS = 24 * 60 * 60 * 1000;
  const addedTodayCount = newlyAdded.filter((m) => {
    const at = m.modified?.time ? Date.parse(m.modified.time) : NaN;
    return Number.isFinite(at) && Date.now() - at < DAY_MS;
  }).length;

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
