/**
 * Shape of a single logo returned from TMDB `/3/{type}/{id}/images`.
 *
 * `iso_639_1` is the language code (e.g. "en", "vi") or `null` for a
 * language-agnostic logo (textless logos use null/empty).
 */
export interface TmdbLogo {
  aspect_ratio: number;
  height: number;
  width: number;
  iso_639_1: string | null;
  file_path: string;
  vote_average: number;
  vote_count: number;
}

/**
 * Subset of the `/3/{type}/{id}/images` response we care about.
 * The endpoint also returns `posters` and `backdrops` — we only consume `logos`.
 */
export interface TmdbImagesResponse {
  id: number;
  logos?: TmdbLogo[];
}
