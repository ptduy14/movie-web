import type { MediaType } from 'constants/tmdb-taxonomy';
import { slugForGenreId, countrySlugForIso } from 'constants/tmdb-taxonomy';
import { CATEGORY_MAP, COUNTRY_MAP } from 'constants/i18n-mappings';
import { mediaId, buildSlug } from 'lib/media-key';
import { tmdbImageUrl } from 'lib/tmdb-image';
import { buildEmbedUrl } from 'services/vidsrc-service';
import type {
  TmdbListItem,
  TmdbMovieDetail,
  TmdbTvDetail,
  TmdbDetail,
  TmdbSeasonDetail,
  TmdbGenre,
} from 'types/tmdb-api';
import type NewlyMovie from 'types/newly-movie';
import type Movie from 'types/movie';
import type DetailMovie from 'types/detail-movie';
import type Episode from 'types/episode';
import type Category from 'types/category';
import type Country from 'types/country';

/**
 * TMDB → the app's view model.
 *
 * The UI layer (30-odd components) speaks `NewlyMovie` / `Movie` /
 * `DetailMovie` / `Episode`. Those shapes were originally the OPhim response
 * shape, but they are now simply this app's domain model: one adapter owns
 * the translation, and swapping providers again would mean rewriting this
 * file and nothing else.
 *
 * Fields TMDB genuinely cannot supply are left `undefined` rather than filled
 * with plausible-looking defaults. Every badge already hides itself on
 * missing data, so an honest gap renders as nothing — which is correct — and
 * a fabricated "HD" would render as a lie.
 */

// ============================================================================
// SMALL HELPERS
// ============================================================================

/** Year from a TMDB `YYYY-MM-DD`, or 0 when absent/malformed. */
function yearOf(date: string | undefined | null): number {
  if (!date) return 0;
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) ? year : 0;
}

function toCategories(
  genres: TmdbGenre[] | undefined,
  genreIds: number[] | undefined,
  mediaType: MediaType,
  locale: string
): Category[] {
  const ids = genres?.map((g) => g.id) ?? genreIds ?? [];
  const seen = new Set<string>();
  const out: Category[] = [];
  for (const id of ids) {
    const slug = slugForGenreId(id, mediaType);
    if (seen.has(slug)) continue; // TV collapses several movie genres onto one id
    seen.add(slug);
    out.push({
      id: String(id),
      // Display always goes through `localizedCategory(slug, locale)` at the
      // render site; this is a readable fallback, not the rendered string.
      name: CATEGORY_MAP[locale as 'vi' | 'en']?.[slug] ?? CATEGORY_MAP.vi[slug] ?? slug,
      slug,
    });
  }
  return out;
}

function toCountries(isoCodes: string[] | undefined, locale: string): Country[] {
  const out: Country[] = [];
  const seen = new Set<string>();
  for (const iso of isoCodes ?? []) {
    const slug = countrySlugForIso(iso);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push({
      id: iso,
      name: COUNTRY_MAP[locale as 'vi' | 'en']?.[slug] ?? COUNTRY_MAP.vi[slug] ?? iso,
      slug,
    });
  }
  return out;
}

/**
 * The `type` discriminator the UI branches on.
 *
 * `isHaveEpisodesMovie()` treats anything but `single` as potentially
 * multi-episode, then checks the episode count — so tagging an animated FILM
 * as `hoathinh` is safe: its single-entry episode list fails the second check.
 */
export type MediaKind = 'single' | 'series' | 'hoathinh' | 'tvshows';

function mediaKind(mediaType: MediaType, genreIds: number[]): MediaKind {
  const has = (id: number) => genreIds.includes(id);
  if (has(16)) return 'hoathinh'; // Animation — both films and series
  if (mediaType === 'movie') return 'single';
  if (has(10764) || has(10767) || has(10763)) return 'tvshows'; // Reality / Talk / News
  return 'series';
}

/** `"130 Phút"` for films, `"45 phút/tập"` for series, `''` when unknown. */
function runtimeLabel(mediaType: MediaType, runtime: number | null | undefined, episodeRunTime: number[] | undefined): string {
  if (mediaType === 'movie') {
    return runtime && runtime > 0 ? `${runtime} Phút` : '';
  }
  // Long-running shows often report an empty array (verified on Game of
  // Thrones), so this must tolerate a missing first element.
  const perEpisode = episodeRunTime?.[0];
  return perEpisode && perEpisode > 0 ? `${perEpisode} phút/tập` : '';
}

/** `"Full"`, `"Hoàn tất (73/73)"` or `"Tập 8"`. */
function episodeStatus(
  mediaType: MediaType,
  status: string | undefined,
  episodeCount: number | undefined
): string {
  if (mediaType === 'movie') return 'Full';
  if (!episodeCount || episodeCount <= 0) return '';
  const ended = status === 'Ended' || status === 'Canceled';
  return ended ? `Hoàn tất (${episodeCount}/${episodeCount})` : `Tập ${episodeCount}`;
}

/**
 * Resolve the media type of a list row.
 *
 * `/search/multi` and `/trending/all` tag each row with `media_type`; the
 * typed discover endpoints do not, so the caller passes the fallback.
 */
export function listItemMediaType(item: TmdbListItem, fallback: MediaType = 'movie'): MediaType {
  if (item.media_type === 'movie' || item.media_type === 'tv') return item.media_type;
  // A row carrying `name`+`first_air_date` but no `title` is a series even
  // when untagged — belt and braces for mixed endpoints.
  if (!item.title && item.name && item.first_air_date) return 'tv';
  return fallback;
}

// ============================================================================
// LIST ITEMS
// ============================================================================

export interface AdaptListOptions {
  locale: string;
  /** Used when the row itself carries no `media_type`. */
  mediaType?: MediaType;
  /** Quality label, only known for rows sourced from a vidsrc latest feed. */
  quality?: string;
  /** ISO timestamp that drives the "MỚI" badge. Only vidsrc feeds have one. */
  addedAt?: string;
}

/**
 * One TMDB list row → `NewlyMovie`.
 *
 * `quality` and `addedAt` stay undefined for everything that did not come
 * from a vidsrc feed: TMDB knows nothing about which rip is available or
 * when it was added, and inventing either would light up badges that carry
 * no information.
 */
export function adaptListItem(item: TmdbListItem, opts: AdaptListOptions): NewlyMovie {
  const { locale } = opts;
  const mediaType = listItemMediaType(item, opts.mediaType);
  const title = (mediaType === 'tv' ? item.name : item.title) ?? item.title ?? item.name ?? '';
  const originalTitle =
    (mediaType === 'tv' ? item.original_name : item.original_title) ?? title;
  const genreIds = item.genre_ids ?? [];

  return {
    _id: mediaId(mediaType, item.id),
    name: title,
    slug: buildSlug(mediaType, item.id, title),
    origin_name: originalTitle,
    thumb_url: tmdbImageUrl(item.poster_path, 'poster'),
    poster_url: tmdbImageUrl(item.backdrop_path ?? item.poster_path, 'backdrop'),
    year: yearOf(mediaType === 'tv' ? item.first_air_date : item.release_date),
    tmdb: {
      type: mediaType,
      id: String(item.id),
      season: 1,
      vote_average: item.vote_average ?? 0,
      vote_count: item.vote_count ?? 0,
    },
    type: mediaKind(mediaType, genreIds),
    category: toCategories(undefined, genreIds, mediaType, locale),
    country: toCountries(item.origin_country, locale),
    // Every title on vidsrc plays with subtitles, never a Vietnamese dub.
    // Saying so is more useful than leaving the chip blank.
    lang: 'Phụ đề',
    quality: opts.quality,
    modified: opts.addedAt ? { time: opts.addedAt } : undefined,
    sub_docquyen: false,
  };
}

export function adaptListItems(items: TmdbListItem[], opts: AdaptListOptions): NewlyMovie[] {
  return items
    // `/search/multi` mixes people into the results; they have no playable id.
    .filter((item) => item.media_type !== 'person')
    .map((item) => adaptListItem(item, opts));
}

// ============================================================================
// DETAIL
// ============================================================================

function isTv(detail: TmdbDetail, mediaType: MediaType): detail is TmdbTvDetail {
  return mediaType === 'tv';
}

/**
 * Seasons worth showing, newest-first ordering left to the caller.
 *
 * Season 0 ("Specials") is dropped: TMDB reports 300 episodes in Game of
 * Thrones' specials season alone, almost none of which vidsrc can play, so
 * including it would bury the real seasons under a wall of dead links.
 */
function playableSeasons(detail: TmdbTvDetail) {
  return (detail.seasons ?? [])
    .filter((s) => s.season_number > 0 && s.episode_count > 0)
    .sort((a, b) => a.season_number - b.season_number);
}

/**
 * Build the episode structure the watch page consumes.
 *
 * The outer array was the OPhim "server" list (Vietsub / Thuyết Minh); with a
 * single embed provider there are no servers, so the slot is reused for
 * SEASONS. `components/watch` renders one selector from this array and one
 * episode list from the selected entry's `server_data`, which is exactly the
 * shape a series needs — no structural change, only a relabelling.
 *
 * Episodes are synthesized from `episode_count` rather than fetched per
 * season. vidsrc addresses an episode by its NUMBER, and the UI labels
 * episodes "Tập N" anyway, so fetching eight season endpoints to learn names
 * the user never sees would cost eight round trips for nothing. Real episode
 * titles are layered on later, for the active season only — see
 * `enrichSeasonEpisodes`.
 *
 * `link_m3u8` is `''` throughout: there is no stream URL behind an embed.
 * The field stays because `types/episode.ts` still declares it and existing
 * stored progress records reference it; nothing reads it for playback.
 */
export function buildEpisodes(
  detail: TmdbDetail,
  mediaType: MediaType,
  imdbId: string | null
): Episode[] {
  const tmdbId = detail.id;

  if (!isTv(detail, mediaType)) {
    const movie = detail as TmdbMovieDetail;
    return [
      {
        server_name: 'vidsrc',
        server_data: [
          {
            name: 'Full',
            slug: 'full',
            filename: movie.title,
            link_embed: buildEmbedUrl({ type: 'movie', tmdbId, imdbId }),
            link_m3u8: '',
          },
        ],
      },
    ];
  }

  const tv = detail as TmdbTvDetail;
  return playableSeasons(tv).map((season) => ({
    server_name: `Phần ${season.season_number}`,
    server_data: Array.from({ length: season.episode_count }, (_, i) => {
      const episodeNumber = i + 1;
      return {
        name: `Tập ${episodeNumber}`,
        slug: `tap-${episodeNumber}`,
        filename: `${tv.name} S${season.season_number}E${episodeNumber}`,
        link_embed: buildEmbedUrl({
          type: 'tv',
          tmdbId,
          imdbId,
          season: season.season_number,
          episode: episodeNumber,
        }),
        link_m3u8: '',
      };
    }),
  }));
}

/**
 * Overlay real episode titles onto one already-built season.
 *
 * Called by the watch page for the season currently on screen, so a viewer
 * sees "Winter Is Coming" instead of "Tập 1" without the detail page paying
 * for every season up front. Mutation-free: returns a new array.
 */
export function enrichSeasonEpisodes(
  episodes: Episode[],
  seasonIndex: number,
  season: TmdbSeasonDetail
): Episode[] {
  const target = episodes[seasonIndex];
  if (!target) return episodes;

  const byNumber = new Map((season.episodes ?? []).map((e) => [e.episode_number, e]));
  const enriched: Episode = {
    ...target,
    server_data: target.server_data.map((ep, i) => {
      const meta = byNumber.get(i + 1);
      return meta?.name ? { ...ep, name: meta.name } : ep;
    }),
  };

  const out = [...episodes];
  out[seasonIndex] = enriched;
  return out;
}

export interface AdaptDetailOptions {
  locale: string;
  mediaType: MediaType;
  /** YouTube key from `getTrailerKey`. */
  trailerKey?: string | null;
  /**
   * Overview text to use instead of `detail.overview`, with the language it
   * is written in. The catalog supplies this when TMDB had no translation in
   * the requested locale and it fell back to English.
   */
  overrideContent?: { text: string; lang: string };
}

/** Full TMDB detail → `DetailMovie` (the shape the detail and watch pages take). */
export function adaptDetail(detail: TmdbDetail, opts: AdaptDetailOptions): DetailMovie {
  const { locale, mediaType, trailerKey } = opts;
  const tv = isTv(detail, mediaType) ? (detail as TmdbTvDetail) : null;
  const film = tv ? null : (detail as TmdbMovieDetail);

  const title = tv ? tv.name : film!.title;
  const originalTitle = (tv ? tv.original_name : film!.original_title) ?? title;
  const imdbId = detail.external_ids?.imdb_id ?? null;
  const genreIds = detail.genres?.map((g) => g.id) ?? [];

  const countries =
    detail.origin_country?.length
      ? detail.origin_country
      : detail.production_countries?.map((c) => c.iso_3166_1);

  const cast = detail.credits?.cast ?? [];
  const crew = detail.credits?.crew ?? [];

  const movie: Movie = {
    _id: mediaId(mediaType, detail.id),
    name: title,
    slug: buildSlug(mediaType, detail.id, title),
    origin_name: originalTitle,
    thumb_url: tmdbImageUrl(detail.poster_path, 'poster'),
    poster_url: tmdbImageUrl(detail.backdrop_path ?? detail.poster_path, 'backdrop'),
    year: yearOf(tv ? tv.first_air_date : film!.release_date),
    tmdb: {
      type: mediaType,
      id: String(detail.id),
      season: 1,
      vote_average: detail.vote_average ?? 0,
      vote_count: detail.vote_count ?? 0,
    },
    imdb: imdbId
      ? // TMDB exposes the IMDb ID but not IMDb's rating, so the vote fields
        // stay at 0 and `RatingBadge` shows the TMDB chip alone.
        { id: imdbId, vote_average: 0, vote_count: 0 }
      : undefined,
    type: mediaKind(mediaType, genreIds),
    sub_docquyen: false,
    chieurap: false,
    time: runtimeLabel(mediaType, film?.runtime, tv?.episode_run_time),
    episode_current: episodeStatus(mediaType, detail.status, tv?.number_of_episodes),
    lang: 'Phụ đề',
    category: toCategories(detail.genres, undefined, mediaType, locale),
    country: toCountries(countries, locale),
    actor: cast.slice(0, 20).map((c) => c.name),
    director: crew.filter((c) => c.job === 'Director').map((c) => c.name),
    content: opts.overrideContent?.text ?? detail.overview ?? '',
    content_lang: opts.overrideContent?.lang ?? locale,
    trailer_url: trailerKey ? `https://www.youtube.com/watch?v=${trailerKey}` : '',
  };

  return { movie, episodes: buildEpisodes(detail, mediaType, imdbId) };
}

/**
 * Number of playable seasons, for callers that need it without rebuilding
 * the whole episode structure.
 */
export function seasonCount(detail: TmdbDetail, mediaType: MediaType): number {
  if (mediaType !== 'tv') return 0;
  return playableSeasons(detail as TmdbTvDetail).length;
}
