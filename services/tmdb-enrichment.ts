import 'server-only';
import type DetailMovie from 'types/detail-movie';
import type { MediaType } from 'constants/tmdb-taxonomy';
import type { TmdbListItem, TmdbMovieDetail, TmdbTvDetail } from 'types/tmdb-api';
import { searchMulti, getDetail, getSeason, getTrailerKey } from 'services/tmdb-catalog-service';
import { withBackupLinks } from 'lib/catalog-adapter';

/**
 * TMDB as an extra on top of the catalog.
 *
 * The catalog is the source of truth for what exists and what plays. TMDB only
 * fills gaps, and only on the detail/watch path where one title is on
 * screen:
 *
 *  - **A TMDB id** for the ~22% of titles the catalog has none for (Game of
 *    Thrones, Iron Man 3…), found by searching the original title. With an
 *    id comes everything below, plus a backup-source address.
 *  - **English text** for the `en` locale: TMDB's own English overview is
 *    better than machine-translating the catalog's Vietnamese one, and free.
 *  - **Rating** when the catalog reports 0 (common for new uploads).
 *  - **Trailer** when the catalog has none.
 *  - **IMDb id** when the catalog has none.
 *
 * Every step is best-effort and the whole pass is time-boxed: a slow or
 * failing TMDB must cost the page its extras, never the page.
 */

const ENRICH_BUDGET_MS = 3000;

// ============================================================================
// MATCHING
// ============================================================================

/** Lower-case, accent-free, punctuation-free — for title equality only. */
function normalizeTitle(title: string | undefined | null): string {
  return (title ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** "The Diplomat (Season 4)" → { title: "The Diplomat", season: 4 }. */
export function splitSeasonTitle(title: string): { title: string; season: number | null } {
  const match = /^(.*?)\s*\((?:Season|Phần|Mùa)\s+(\d+)\)\s*$/i.exec(title.trim());
  return match
    ? { title: match[1].trim(), season: parseInt(match[2], 10) }
    : { title: title.trim(), season: null };
}

function yearOf(date: string | undefined): number | null {
  const year = Number(date?.slice(0, 4));
  return Number.isFinite(year) && year > 0 ? year : null;
}

/**
 * Find the TMDB entry for a title the catalog has no TMDB id for.
 *
 * Deliberately strict — a wrong match would show the wrong cast, rating and
 * trailer, and send the backup player to a different film, which is worse
 * than showing nothing. A candidate must:
 *
 *  - be the right media type (the catalog `single` → movie, anything else that is
 *    a series → tv; animation can be either, so both are allowed);
 *  - match the original title exactly after normalization (either TMDB's
 *    localized or original title);
 *  - for a film, be released within a year of the catalog's year;
 *  - for a series, have first aired no later than this season's year
 *    (season 4 of a 2023 show airs in 2026, so equality is too strict).
 *
 * And exactly one candidate may pass. Two equally good matches ("The Office"
 * US and UK) is no match.
 */
export async function matchTmdb(
  movie: DetailMovie['movie']
): Promise<{ type: MediaType; id: number; season: number | null } | null> {
  const { title, season } = splitSeasonTitle(movie.origin_name || movie.name);
  const wanted = normalizeTitle(title);
  if (!wanted) return null;

  const allowed: MediaType[] =
    movie.type === 'single' ? ['movie'] : movie.type === 'hoathinh' ? ['movie', 'tv'] : ['tv'];
  const year = movie.year || null;

  const res = await searchMulti(title, 'en');
  const passes = (item: TmdbListItem) => {
    const type = item.media_type;
    if (type !== 'movie' && type !== 'tv') return false;
    if (!allowed.includes(type)) return false;

    const names = type === 'movie' ? [item.title, item.original_title] : [item.name, item.original_name];
    if (!names.some((n) => normalizeTitle(n) === wanted)) return false;

    const released = yearOf(type === 'movie' ? item.release_date : item.first_air_date);
    if (!year || !released) return true;
    return type === 'movie' ? Math.abs(released - year) <= 1 : released <= year + 1;
  };

  const hits = res.results.filter(passes);
  if (hits.length !== 1) return null;
  const hit = hits[0];
  return {
    type: hit.media_type as MediaType,
    id: hit.id,
    season: hit.media_type === 'tv' ? season ?? 1 : null,
  };
}

// ============================================================================
// ENRICHMENT
// ============================================================================

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise
      .then((value) => resolve(value))
      .catch(() => resolve(null))
      .finally(() => clearTimeout(timer));
  });
}

async function enrich(detail: DetailMovie, locale: string): Promise<DetailMovie> {
  const movie = { ...detail.movie };
  let episodes = detail.episodes;

  // 1. A TMDB reference, from the catalog or by matching.
  let type = (movie.tmdb?.type as MediaType | null) ?? null;
  let id = movie.tmdb?.id ?? null;
  let season = movie.tmdb?.season ?? null;
  let matched = false;

  if (!id || !type) {
    const match = await matchTmdb(movie).catch(() => null);
    if (!match) return detail;
    type = match.type;
    id = String(match.id);
    season = match.season;
    matched = true;
  }

  // 2. The TMDB record in the page's language, plus the season record for a
  //    series (its overview describes THIS season, not the show).
  const [tmdb, seasonDetail] = await Promise.all([
    getDetail(type, id, locale).catch(() => null) as Promise<TmdbMovieDetail | TmdbTvDetail | null>,
    type === 'tv' && season ? getSeason(id, season, locale).catch(() => null) : Promise.resolve(null),
  ]);

  movie.tmdb = {
    type,
    id,
    season,
    vote_average: movie.tmdb?.vote_average || tmdb?.vote_average || 0,
    vote_count: movie.tmdb?.vote_count || tmdb?.vote_count || 0,
  };

  // Sharp hero image; the catalog's landscape still is often 780px wide.
  if (!movie.tmdb_backdrop && tmdb?.backdrop_path) movie.tmdb_backdrop = tmdb.backdrop_path;

  const imdbId = tmdb?.external_ids?.imdb_id;
  if (!movie.imdb?.id && imdbId) {
    movie.imdb = { id: imdbId, vote_average: 0, vote_count: 0 };
  }

  // 3. English text for the English site. The catalog writes only Vietnamese, so
  //    without this every `en` synopsis is a machine translation.
  if (locale !== 'vi' && tmdb) {
    const overview = seasonDetail?.overview?.trim() || tmdb.overview?.trim();
    if (overview) {
      movie.content = overview;
      movie.content_lang = locale;
    }
    const tmdbTitle = 'title' in tmdb ? tmdb.title : tmdb.name;
    if (tmdbTitle) {
      movie.origin_name = type === 'tv' && season ? `${tmdbTitle} (Season ${season})` : tmdbTitle;
    }
  }

  // 4. A trailer when the catalog has none.
  if (!movie.trailer_url) {
    const key = await getTrailerKey(type, id, locale).catch(() => null);
    if (key) movie.trailer_url = `https://www.youtube.com/watch?v=${key}`;
  }

  // 5. A backup-source address for titles that had no id to build one from.
  if (matched) {
    episodes = withBackupLinks(episodes, movie.tmdb, movie.imdb?.id ?? null);
  }

  return { movie, episodes };
}

/**
 * Fill a catalog detail's gaps from TMDB. Resolves within ~3 s no matter
 * what; on timeout or failure the detail comes back unchanged.
 */
export async function enrichDetail(detail: DetailMovie, locale: string): Promise<DetailMovie> {
  return (await withTimeout(enrich(detail, locale), ENRICH_BUDGET_MS)) ?? detail;
}
