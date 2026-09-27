import Tmdb from './tmdb';
import Imdb from './imdb';
import Modified from './modified';
import Category from './category';
import Country from './country';

/**
 * A title as it appears in a list (home rails, browse grids, search results).
 *
 * Built by `lib/tmdb-adapter.ts` from a TMDB list row. Most fields are
 * optional because TMDB's list endpoints return strictly less than its
 * detail endpoint, and because a few fields have no TMDB equivalent at all:
 *
 *  - `quality` / `modified` exist only for rows that came from a vidsrc
 *    "recently added" feed. TMDB knows neither.
 *  - `imdb` carries the IMDb ID but zeroed votes — TMDB exposes the id, not
 *    the rating.
 *  - `sub_docquyen` is always false; there is no exclusivity concept.
 *
 * Rendering code treats every absent field as "hide that badge", so gaps
 * degrade to nothing rather than to `undefined` on screen.
 */
export default interface NewlyMovie {
  /** Namespaced, e.g. `"movie-68721"` — TMDB numbers movies and TV separately
   *  and the two sequences collide, so the type must be part of the key. */
  _id: string;
  name: string;
  /** URL slug, e.g. `"nguoi-sat-3-movie-68721"`. Parse with `lib/media-key`. */
  slug: string;
  origin_name: string;
  /** Absolute poster URL (portrait). */
  thumb_url: string;
  year: number;
  tmdb: Tmdb;

  /** Absolute backdrop URL (landscape), falling back to the poster. */
  poster_url?: string;
  imdb?: Imdb;
  /** Only set for vidsrc-feed rows; drives the "MỚI" badge. */
  modified?: Modified;
  alternative_names?: string[];
  type?: string; // "series" | "single" | "hoathinh" | "tvshows"
  sub_docquyen?: boolean;
  time?: string; // duration label e.g. "45 phút/tập"
  episode_current?: string; // "Tập 8" | "Hoàn tất (40/40)" | "Full"
  quality?: string; // "1080p" | "720p" — vidsrc feed rows only
  lang?: string; // always "Phụ đề" — vidsrc serves subtitles, never a VI dub
  category?: Category[];
  country?: Country[];
}
