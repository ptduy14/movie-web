/**
 * Raw response shapes from the TMDB v3 API.
 *
 * These mirror TMDB exactly — they are NOT what the UI consumes. The adapter
 * in `lib/tmdb-adapter.ts` maps them onto the app's own view model
 * (`types/movie.ts`, `types/newly-movie.ts`, `types/detail-movie.ts`).
 * Keeping the two apart means a provider change touches the adapter only.
 *
 * Fields are optional wherever TMDB may omit them in practice — list
 * endpoints return a narrower object than detail endpoints, and several
 * fields (`runtime`, `imdb_id`, `backdrop_path`) are genuinely null for
 * parts of the catalog.
 */

export interface TmdbGenre {
  id: number;
  name: string;
}

/** A row from `/discover`, `/search`, `/trending`. Detail endpoints return a superset. */
export interface TmdbListItem {
  id: number;
  /** Present on movies. */
  title?: string;
  original_title?: string;
  release_date?: string;
  /** Present on TV. */
  name?: string;
  original_name?: string;
  first_air_date?: string;
  /** Only present on `/search/multi` and `/trending/all`; absent on typed endpoints. */
  media_type?: 'movie' | 'tv' | 'person';
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genre_ids?: number[];
  origin_country?: string[];
  original_language?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  adult?: boolean;
}

export interface TmdbPagedResponse<T = TmdbListItem> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbExternalIds {
  imdb_id?: string | null;
  tvdb_id?: number | null;
  wikidata_id?: string | null;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
  order?: number;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job?: string;
  department?: string;
}

export interface TmdbCredits {
  cast?: TmdbCastMember[];
  crew?: TmdbCrewMember[];
}

export interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  official?: boolean;
  iso_639_1?: string;
}

export interface TmdbProductionCountry {
  iso_3166_1: string;
  name: string;
}

/** `/3/movie/{id}` with `append_to_response=external_ids,credits,videos`. */
export interface TmdbMovieDetail {
  id: number;
  title: string;
  original_title?: string;
  overview?: string;
  release_date?: string;
  runtime?: number | null;
  status?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genres?: TmdbGenre[];
  origin_country?: string[];
  production_countries?: TmdbProductionCountry[];
  original_language?: string;
  vote_average?: number;
  vote_count?: number;
  adult?: boolean;
  external_ids?: TmdbExternalIds;
  credits?: TmdbCredits;
  videos?: { results?: TmdbVideo[] };
}

export interface TmdbSeasonSummary {
  season_number: number;
  episode_count: number;
  name?: string;
  air_date?: string | null;
  poster_path?: string | null;
}

/** `/3/tv/{id}` with `append_to_response=external_ids,credits,videos`. */
export interface TmdbTvDetail {
  id: number;
  name: string;
  original_name?: string;
  overview?: string;
  first_air_date?: string;
  last_air_date?: string;
  status?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  poster_path?: string | null;
  backdrop_path?: string | null;
  genres?: TmdbGenre[];
  origin_country?: string[];
  production_countries?: TmdbProductionCountry[];
  original_language?: string;
  vote_average?: number;
  vote_count?: number;
  adult?: boolean;
  seasons?: TmdbSeasonSummary[];
  external_ids?: TmdbExternalIds;
  credits?: TmdbCredits;
  videos?: { results?: TmdbVideo[] };
}

export interface TmdbEpisode {
  episode_number: number;
  season_number: number;
  name?: string;
  overview?: string;
  still_path?: string | null;
  air_date?: string | null;
  runtime?: number | null;
}

/** `/3/tv/{id}/season/{n}`. */
export interface TmdbSeasonDetail {
  season_number: number;
  name?: string;
  /** Describes this season; often empty in non-English locales. */
  overview?: string;
  episodes?: TmdbEpisode[];
}

/** Union used by the adapter, which handles both without branching at call sites. */
export type TmdbDetail = TmdbMovieDetail | TmdbTvDetail;

export function isTvDetail(detail: TmdbDetail): detail is TmdbTvDetail {
  return 'name' in detail && !('title' in detail);
}
