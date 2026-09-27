import 'server-only';
import type NewlyMovie from 'types/newly-movie';
import type DetailMovie from 'types/detail-movie';
import type { MediaType } from 'constants/tmdb-taxonomy';
import { parseSlug } from 'lib/media-key';
import {
  discover,
  discoverByFormat,
  trending,
  searchMulti,
  getDetail,
  getTrailerKey,
  getSeason,
  TmdbError,
} from 'services/tmdb-catalog-service';
import {
  adaptListItem,
  adaptListItems,
  adaptDetail,
  enrichSeasonEpisodes,
  listItemMediaType,
} from 'lib/tmdb-adapter';
import { filterAvailable } from 'services/vidsrc-availability';
import { getLatest, type VidsrcLatestMovie } from 'services/vidsrc-service';
import redis from 'lib/upstash';
import type { TmdbListItem } from 'types/tmdb-api';
import type Episode from 'types/episode';
import type { MovieFilters } from 'types/movie-filters';

export type { MovieFilters };

/**
 * The catalog, as the rest of the app sees it.
 *
 * Everything above this line works in TMDB responses and vidsrc ids;
 * everything below works in `NewlyMovie` / `DetailMovie`. Pages and server
 * actions call only this module, so a future provider swap is a rewrite of
 * this file plus the adapter, not of the UI.
 *
 * Two things happen here that are easy to miss:
 *
 *  1. **Availability filtering.** Every list is intersected with the ids
 *     vidsrc can play. That makes returned page sizes irregular, which is
 *     why each browse result reports `hasMore` explicitly instead of letting
 *     the caller infer it from item count.
 *  2. **Failure is a value, not an exception.** Home rails resolve to `[]`
 *     on upstream trouble so one dead rail can't take the page down. Browse
 *     and detail paths still throw, because there the failure IS the page.
 */

export interface CatalogPage {
  items: NewlyMovie[];
  /**
   * TMDB's result count for this filter, BEFORE availability filtering, or
   * null when the number would mislead. Browse pages pass null: showing
   * "12,400 titles" above a grid that can only play a fraction of them is
   * worse than showing no number.
   */
  totalItems: number | null;
  hasMore: boolean;
}

const EMPTY_PAGE: CatalogPage = { items: [], totalItems: null, hasMore: false };

/** Pull the media ref out of an adapted item for the availability filter. */
function refOf(item: NewlyMovie): { type: MediaType; id: string } | null {
  const type = item.tmdb?.type;
  const id = item.tmdb?.id;
  if ((type !== 'movie' && type !== 'tv') || !id) return null;
  return { type, id };
}

async function keepPlayable(items: NewlyMovie[]): Promise<NewlyMovie[]> {
  return filterAvailable(items, refOf);
}

// ============================================================================
// HOME RAILS
// ============================================================================

/**
 * Rails never throw.
 *
 * The home page fans out five or more of these at once. Under the previous
 * provider they were combined with `Promise.all`, so a single rejection took
 * out the entire server render and the page flushed a blank 200. Returning
 * `[]` keeps that failure local to one rail.
 */
async function safeRail(load: () => Promise<NewlyMovie[]>): Promise<NewlyMovie[]> {
  try {
    return await load();
  } catch (err) {
    console.warn('[catalog] rail failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

export async function getTrendingRail(locale: string, limit = 20): Promise<NewlyMovie[]> {
  return safeRail(async () => {
    const res = await trending('all', locale);
    const items = adaptListItems(res.results, { locale });
    return (await keepPlayable(items)).slice(0, limit);
  });
}

export async function getFormatRail(
  formatSlug: string,
  locale: string,
  limit = 10
): Promise<NewlyMovie[]> {
  return safeRail(async () => {
    const res = await discoverByFormat(formatSlug, { locale, page: 1 });
    const items = res.results.map((item, i) =>
      adaptListItem(item, { locale, mediaType: res.mediaTypeByIndex[i] })
    );
    return (await keepPlayable(items)).slice(0, limit);
  });
}

export async function getGenreRail(
  genreSlug: string,
  locale: string,
  limit = 10
): Promise<NewlyMovie[]> {
  return safeRail(async () => {
    const res = await discover({ mediaType: 'movie', locale, genreSlug, page: 1 });
    const items = adaptListItems(res.results, { locale, mediaType: 'movie' });
    return (await keepPlayable(items)).slice(0, limit);
  });
}

const LATEST_RAIL_TTL_SECONDS = 60 * 15;
const LATEST_RAIL_SIZE = 14;

/**
 * "Mới cập nhật" — the only rail that reflects what vidsrc actually just
 * added, rather than what TMDB finds popular.
 *
 * The feed gives an id, a title and a quality label but no artwork, so each
 * row needs a TMDB lookup to become a card. That fan-out is cached in Redis
 * for fifteen minutes so it costs one burst of lookups per quarter hour
 * across all visitors, not one per render. Without Redis it still works —
 * it just pays the fan-out every time.
 *
 * No availability filter here: every row came FROM vidsrc, so it is playable
 * by construction.
 */
export async function getNewlyAddedRail(locale: string): Promise<NewlyMovie[]> {
  return safeRail(async () => {
    const cacheKey = `vs:rail:latest:${locale}`;
    if (redis) {
      try {
        const cached = await redis.get<NewlyMovie[]>(cacheKey);
        if (cached?.length) return cached;
      } catch {
        // Fall through to a live build.
      }
    }

    const feed = await getLatest<VidsrcLatestMovie>('movies', 1);
    const withTmdb = feed.filter((row) => row.tmdb_id).slice(0, LATEST_RAIL_SIZE);
    if (withTmdb.length === 0) return [];

    const settled = await Promise.allSettled(
      withTmdb.map(async (row) => {
        const detail = await getDetail('movie', row.tmdb_id!, locale);
        const { movie } = adaptDetail(detail, { locale, mediaType: 'movie' });
        return {
          ...movie,
          quality: row.quality,
          // vidsrc stamps "YYYY-MM-DD HH:mm:ss" with no zone. Normalizing to
          // ISO keeps `Date.parse` in NewUpdateBadge from returning NaN.
          modified: row.time_added ? { time: row.time_added.replace(' ', 'T') + 'Z' } : undefined,
        } as NewlyMovie;
      })
    );

    const items = settled
      .filter((r): r is PromiseFulfilledResult<NewlyMovie> => r.status === 'fulfilled')
      .map((r) => r.value);

    if (redis && items.length) {
      try {
        await redis.set(cacheKey, items, { ex: LATEST_RAIL_TTL_SECONDS });
      } catch {
        // Cache write failure is non-fatal.
      }
    }
    return items;
  });
}

// ============================================================================
// BROWSE
// ============================================================================

function buildPage(
  raw: { results: TmdbListItem[]; page: number; total_pages: number },
  items: NewlyMovie[]
): CatalogPage {
  return {
    items,
    totalItems: null,
    hasMore: raw.page < raw.total_pages,
  };
}

export async function browseByGenre(
  genreSlug: string,
  page: number,
  filters: MovieFilters | undefined,
  locale: string
): Promise<CatalogPage> {
  // A genre page covers films and series alike; TMDB's discover does not, so
  // the two are queried separately and interleaved. `hoat-hinh` already does
  // this at the format level — same reasoning, same shape.
  const [movieRes, tvRes] = await Promise.all([
    discover({
      mediaType: 'movie',
      locale,
      page,
      genreSlug,
      countrySlug: filters?.country,
      year: filters?.year,
      sort: filters?.sort,
    }).catch(() => null),
    discover({
      mediaType: 'tv',
      locale,
      page,
      genreSlug,
      countrySlug: filters?.country,
      year: filters?.year,
      sort: filters?.sort,
    }).catch(() => null),
  ]);

  if (!movieRes && !tvRes) {
    throw new TmdbError('genre browse failed for both media types', 0, `/discover[${genreSlug}]`);
  }

  const interleaved: NewlyMovie[] = [];
  const longest = Math.max(movieRes?.results.length ?? 0, tvRes?.results.length ?? 0);
  for (let i = 0; i < longest; i++) {
    const m = movieRes?.results[i];
    const t = tvRes?.results[i];
    if (m) interleaved.push(adaptListItem(m, { locale, mediaType: 'movie' }));
    if (t) interleaved.push(adaptListItem(t, { locale, mediaType: 'tv' }));
  }

  return {
    items: await keepPlayable(interleaved),
    totalItems: null,
    hasMore: page < Math.max(movieRes?.total_pages ?? 0, tvRes?.total_pages ?? 0),
  };
}

export async function browseByCountry(
  countrySlug: string,
  page: number,
  filters: MovieFilters | undefined,
  locale: string
): Promise<CatalogPage> {
  const res = await discover({
    mediaType: 'movie',
    locale,
    page,
    countrySlug,
    genreSlug: filters?.category,
    year: filters?.year,
    sort: filters?.sort,
  });
  const items = await keepPlayable(adaptListItems(res.results, { locale, mediaType: 'movie' }));
  return buildPage(res, items);
}

export async function browseByFormat(
  formatSlug: string,
  page: number,
  filters: MovieFilters | undefined,
  locale: string
): Promise<CatalogPage> {
  const res = await discoverByFormat(formatSlug, {
    locale,
    page,
    countrySlug: filters?.country,
    year: filters?.year,
    sort: filters?.sort,
    genreSlug: filters?.category,
  });
  const adapted = res.results.map((item, i) =>
    adaptListItem(item, { locale, mediaType: res.mediaTypeByIndex[i] })
  );
  return {
    items: await keepPlayable(adapted),
    totalItems: null,
    hasMore: page < res.total_pages,
  };
}

// ============================================================================
// SEARCH
// ============================================================================

/**
 * Search across films and series.
 *
 * People results are dropped by the adapter. Availability filtering applies
 * here too: a search that surfaces a title the player cannot open is worse
 * than one that simply doesn't list it.
 */
export async function searchTitles(query: string, locale: string, page = 1): Promise<CatalogPage> {
  const res = await searchMulti(query, locale, page);
  const items = await keepPlayable(adaptListItems(res.results, { locale }));
  return { items, totalItems: null, hasMore: page < res.total_pages };
}

// ============================================================================
// DETAIL
// ============================================================================

/**
 * Resolve a URL slug to a full title.
 *
 * Returns null for an unparseable slug or a TMDB 404 so callers can redirect
 * instead of catching. Any other upstream failure still throws — a timeout
 * is not the same thing as "this title does not exist", and silently
 * redirecting home on a blip would hide a real outage.
 */
export async function getTitleDetail(
  slug: string,
  locale: string
): Promise<DetailMovie | null> {
  const ref = parseSlug(slug);
  if (!ref) return null;

  try {
    const [detail, trailerKey] = await Promise.all([
      getDetail(ref.type, ref.id, locale),
      getTrailerKey(ref.type, ref.id, locale).catch(() => null),
    ]);

    // TMDB answers a vi-VN request with an EMPTY overview when no Vietnamese
    // translation exists — it does not fall back on its own. Rather than
    // render a title with no synopsis, fetch the English one and mark it, so
    // the localizer knows a machine translation is warranted.
    let overrideContent: { text: string; lang: string } | undefined;
    if (locale !== 'en' && !detail.overview) {
      try {
        const english = await getDetail(ref.type, ref.id, 'en');
        if (english.overview) overrideContent = { text: english.overview, lang: 'en' };
      } catch {
        // No synopsis is survivable; the detail page just renders without one.
      }
    }

    return adaptDetail(detail, { locale, mediaType: ref.type, trailerKey, overrideContent });
  } catch (err) {
    if (err instanceof TmdbError && err.status === 404) return null;
    throw err;
  }
}

/**
 * Real episode titles for one season of an already-built title.
 *
 * The detail path synthesizes episodes from season counts (see
 * `buildEpisodes`), which costs nothing but yields "Tập 1". The watch page
 * calls this for the season on screen so the list reads "Winter Is Coming"
 * instead — one request, not one per season.
 */
export async function withSeasonTitles(
  episodes: Episode[],
  tmdbId: string,
  seasonIndex: number,
  locale: string
): Promise<Episode[]> {
  try {
    // Season index is zero-based over the playable seasons, which start at 1.
    const season = await getSeason(tmdbId, seasonIndex + 1, locale);
    return enrichSeasonEpisodes(episodes, seasonIndex, season);
  } catch {
    return episodes;
  }
}

/**
 * "More like this" — same first genre, same media type, minus the title
 * itself. Best-effort: an empty array hides the rail.
 */
export async function getRelatedTitles(
  detail: DetailMovie,
  locale: string,
  limit = 10
): Promise<NewlyMovie[]> {
  return safeRail(async () => {
    const genreSlug = detail.movie.category?.[0]?.slug;
    const mediaType = (detail.movie.tmdb?.type ?? 'movie') as MediaType;
    if (!genreSlug) return [];

    const res = await discover({ mediaType, locale, genreSlug, page: 1 });
    const items = adaptListItems(res.results, { locale, mediaType }).filter(
      (m) => m._id !== detail.movie._id
    );
    return (await keepPlayable(items)).slice(0, limit);
  });
}

/**
 * Same-genre titles for a slug, used by the "because you watched" rail where
 * only a slug from watch history is available.
 */
export async function getBecauseYouWatchedTitles(
  slug: string,
  locale: string,
  limit = 10
): Promise<NewlyMovie[]> {
  return safeRail(async () => {
    const detail = await getTitleDetail(slug, locale);
    if (!detail) return [];
    return getRelatedTitles(detail, locale, limit);
  });
}

export { listItemMediaType, EMPTY_PAGE };
