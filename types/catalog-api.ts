/**
 * Raw catalog API response shapes, as probed live on 2026-10-16.
 *
 * Only `services/catalog-api.ts` and `lib/catalog-adapter.ts` should import
 * these; everything above the adapter works in the app's own view model.
 *
 * Fields are typed as loosely as the API actually behaves: image paths may be
 * relative or absolute, `tmdb.id` is null for roughly a fifth of the catalog,
 * and `status` is a boolean on some endpoints and the string "success" on
 * others. The service normalizes the envelope; the adapter normalizes items.
 */

export interface ApiTmdbRef {
  id: string | null;
  type: 'movie' | 'tv' | null;
  season: number | null;
  vote_average: number;
  vote_count: number;
}

export interface ApiImdbRef {
  id: string | null;
  vote_average: number;
  vote_count: number;
}

export interface ApiTaxonomyRef {
  id: string;
  name: string;
  slug: string;
}

/** `single` = film, `series`, `hoathinh` = animation (film or series), `tvshows`. */
export type ApiType = 'single' | 'series' | 'hoathinh' | 'tvshows';

/** A row from any list endpoint (home, danh-sach, the-loai, quoc-gia, nam, tim-kiem). */
export interface ApiListItem {
  tmdb?: ApiTmdbRef;
  imdb?: ApiImdbRef;
  modified?: { time: string };
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  alternative_names?: string[];
  type?: ApiType;
  /** LANDSCAPE image. Relative (`uploads/movies/…`, `upload/vod/…`) in lists. */
  thumb_url: string | null;
  /** PORTRAIT image. Same path conventions as `thumb_url`. */
  poster_url: string | null;
  sub_docquyen?: boolean;
  chieurap?: boolean;
  time?: string;
  episode_current?: string;
  quality?: string;
  lang?: string;
  /** `vs` (Vietsub), `tm` (Thuyết Minh), `lt` (Lồng Tiếng). */
  lang_key?: string[];
  year: number | null;
  category?: ApiTaxonomyRef[];
  country?: ApiTaxonomyRef[];
}

export interface ApiEpisodeItem {
  name: string;
  slug: string;
  filename: string;
  /** `player.phimapi.com` embed — ads + tracking, not used by the app. */
  link_embed: string;
  /** HLS master playlist. Only reachable from Vietnamese IPs. */
  link_m3u8: string;
}

export interface ApiServer {
  /** "Vietsub" | "Thuyết Minh" | "Lồng Tiếng" (sometimes with a "#Hà Nội" suffix). */
  server_name: string;
  server_data: ApiEpisodeItem[];
}

export interface ApiDetailMovie extends ApiListItem {
  created?: { time: string };
  /** HTML (`<p>…</p>`). */
  content: string;
  status?: 'ongoing' | 'completed' | 'trailer' | string;
  is_copyright?: boolean;
  is_published?: boolean;
  trailer_url?: string | null;
  episode_total?: number | string | null;
  notify?: string;
  showtimes?: string;
  view?: number;
  actor?: string[];
  director?: string[];
}

export interface ApiDetailResponse {
  status: boolean | string;
  msg?: string;
  movie: ApiDetailMovie;
  episodes: ApiServer[];
}

export interface ApiPagination {
  totalItems: number;
  totalItemsPerPage: number;
  currentPage: number;
  totalPages: number;
  /** Only on `phim-moi-cap-nhat-v3`. */
  updateToday?: number;
}

/** The `/v1/api/*` list envelope. */
export interface ApiWrappedList {
  status: boolean | string;
  msg?: string;
  message?: string;
  data: {
    items: ApiListItem[];
    params?: {
      pagination?: ApiPagination;
      /** Only on `/v1/api/home`. */
      itemsUpdateInDay?: number;
    };
    APP_DOMAIN_CDN_IMAGE?: string;
  };
}

/** The legacy flat list envelope (`/danh-sach/phim-moi-cap-nhat*`). */
export interface ApiFlatList {
  status: boolean | string;
  msg?: string;
  items: ApiListItem[];
  pagination?: ApiPagination;
  pathImage?: string;
}

/** `/v1/api/phim/{slug}/images` — TMDB artwork mirrored by the catalog. */
export interface ApiImagesResponse {
  success: boolean;
  data: {
    tmdb_id: number | null;
    tmdb_type: 'movie' | 'tv' | null;
    images: {
      width: number;
      height: number;
      aspect_ratio: number;
      type: 'backdrop' | 'poster' | string;
      file_path: string;
      iso_639_1?: string | null;
    }[];
  };
}

/** `/v1/api/phim/{slug}/peoples` — TMDB credits mirrored by the catalog. */
export interface ApiPeoplesResponse {
  success: boolean;
  data: {
    tmdb_id: number | null;
    tmdb_type: 'movie' | 'tv' | null;
    peoples: {
      tmdb_people_id: number;
      gender: number;
      name: string;
      original_name: string;
      character: string;
      known_for_department: string;
      /** TMDB profile path (`/abc.jpg`) or `''`. */
      profile_path: string;
    }[];
  };
}

/** `/the-loai`, `/quoc-gia`. */
export interface ApiTaxonomyResponse {
  status: boolean | string;
  data: { items: { _id: string; name: string; slug: string }[] };
}
