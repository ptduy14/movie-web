import Tmdb from './tmdb';
import Imdb from './imdb';
import Modified from './modified';
import Category from './category';
import Country from './country';

/**
 * Shape of a movie list item returned by `/v1/api/home` (and similar v1 list endpoints).
 * - All v1/home-only fields are optional to remain backwards-compatible
 *   with older endpoints that may not return them.
 * - `poster_url` is optional because v1/home does NOT include it
 *   (only available from `/phim/{slug}` detail endpoint).
 */
export default interface NewlyMovie {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  thumb_url: string;
  year: number;
  tmdb: Tmdb;

  // Optional — v1/home returns these; older endpoints may not
  poster_url?: string;
  imdb?: Imdb;
  modified?: Modified;
  alternative_names?: string[];
  type?: string; // "series" | "single" | "hoathinh" | "tvshows"
  sub_docquyen?: boolean;
  time?: string; // duration label e.g. "45 phút/tập"
  episode_current?: string; // "Tập 8" | "Hoàn tất (40/40)" | "Trailer"
  quality?: string; // "HD" | "Full HD" | "4K"
  lang?: string; // "Vietsub" | "Thuyết Minh" | "Vietsub + Thuyết Minh"
  category?: Category[];
  country?: Country[];
}
