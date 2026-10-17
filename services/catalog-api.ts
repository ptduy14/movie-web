import 'server-only';
import type {
  ApiDetailResponse,
  ApiFlatList,
  ApiImagesResponse,
  ApiListItem,
  ApiPagination,
  ApiPeoplesResponse,
  ApiTaxonomyResponse,
  ApiWrappedList,
} from 'types/catalog-api';

/**
 * Raw catalog API access (`https://phimapi.com`).
 *
 * One place that knows about timeouts, cache windows and the two envelope
 * styles; everything above it works in app types via `lib/catalog-adapter.ts`.
 *
 * Three things this API does that callers should never have to think about:
 *
 *  1. **Two envelopes.** `/v1/api/*` wraps rows in `data.items` with the
 *     pagination under `data.params`; the older `/danh-sach/phim-moi-cap-nhat*`
 *     routes return `items` and `pagination` at the top level. `toPage`
 *     flattens both into `ApiPage`.
 *  2. **`status` is not a reliable success flag.** It is boolean `true` on
 *     some endpoints and the string `"success"` on others, and that split
 *     moved between August and October 2026. Success here means: HTTP 2xx,
 *     JSON body, and the payload we asked for is present.
 *  3. **Misses are JSON 404s** — `{"status":false,"msg":"hmmm!"}` — so a
 *     missing title is a `CatalogApiError` with status 404 that detail callers
 *     turn into `null`, not a parse failure.
 *
 * Stream URLs are never fetched here. The video CDN only answers Vietnamese
 * IPs, and this module runs on Vercel; `link_m3u8` is handed to the browser.
 */

const API_BASE = process.env.CATALOG_API_BASE ?? 'https://phimapi.com';
const TIMEOUT_MS = 8000;

/**
 * Default image host for list rows, which carry relative paths. List
 * responses also announce it as `APP_DOMAIN_CDN_IMAGE`; when they do, that
 * value wins.
 */
export const CATALOG_IMAGE_CDN = 'https://phimimg.com';

/** The API clamps `limit` at 64; asking for more silently returns 64. */
export const CATALOG_MAX_LIMIT = 64;

/** Cache windows. Lists move every few minutes; a title's metadata rarely. */
const REVALIDATE = {
  /** "Mới cập nhật" — the feed that changes fastest. */
  latest: 60 * 5, // 5 min
  /** Browse lists and home rails. */
  list: 60 * 15, // 15 min
  /**
   * Title detail. Kept short because it carries `link_m3u8`, and the stream
   * host has changed three times in a year. A day-old detail could point at
   * a dead host.
   */
  detail: 60 * 30, // 30 min
  /** TMDB-mirrored artwork and credits. */
  extras: 60 * 60 * 24, // 24 h
  /** Genre / country lists. */
  taxonomy: 60 * 60 * 24, // 24 h
  /** Search: short, because a retried typo wants fresh hits. */
  search: 60 * 5, // 5 min
} as const;

export class CatalogApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly path: string
  ) {
    super(message);
    this.name = 'CatalogApiError';
  }
}

type QueryValue = string | number | boolean | undefined | null;

async function apiFetch<T>(
  path: string,
  params: Record<string, QueryValue> = {},
  revalidate: number = REVALIDATE.list
): Promise<T> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }

  const url = `${API_BASE}${path}${search.toString() ? `?${search}` : ''}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
      next: { revalidate },
    });

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      // A Cloudflare challenge or an nginx error page. Say so instead of
      // letting `res.json()` throw a SyntaxError from inside a render.
      throw new CatalogApiError(
        `Catalog API returned non-JSON (${res.status}, ${contentType || 'no content-type'})`,
        res.status,
        path
      );
    }

    if (!res.ok) {
      throw new CatalogApiError(`Catalog API responded ${res.status}`, res.status, path);
    }

    const body = (await res.json()) as T & { status?: unknown };
    // A 200 can still carry `{status:false}` on some routes.
    if (body?.status === false) {
      throw new CatalogApiError('Catalog API reported status:false', 404, path);
    }
    return body;
  } catch (err) {
    if (err instanceof CatalogApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new CatalogApiError(`Catalog API timed out after ${TIMEOUT_MS}ms`, 408, path);
    }
    throw new CatalogApiError(err instanceof Error ? err.message : 'Catalog API request failed', 0, path);
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================================
// ENVELOPE NORMALIZATION
// ============================================================================

/** Every list endpoint, flattened to one shape. */
export interface ApiPage {
  items: ApiListItem[];
  page: number;
  totalPages: number;
  totalItems: number;
  /** Base URL for the relative image paths in `items`. */
  imageCdn: string;
  /** Titles updated today — only the home and latest-v3 feeds report it. */
  updatedToday?: number;
}

function toPage(body: ApiWrappedList | ApiFlatList, path: string): ApiPage {
  const wrapped = 'data' in body && body.data ? body.data : null;
  const items = wrapped ? wrapped.items : (body as ApiFlatList).items;
  if (!Array.isArray(items)) {
    throw new CatalogApiError('the catalog list response has no items', 0, path);
  }

  const pagination: ApiPagination | undefined = wrapped
    ? wrapped.params?.pagination
    : (body as ApiFlatList).pagination;

  return {
    items,
    page: pagination?.currentPage ?? 1,
    totalPages: pagination?.totalPages ?? 1,
    totalItems: pagination?.totalItems ?? items.length,
    imageCdn: wrapped?.APP_DOMAIN_CDN_IMAGE || CATALOG_IMAGE_CDN,
    updatedToday: wrapped?.params?.itemsUpdateInDay ?? pagination?.updateToday,
  };
}

// ============================================================================
// LISTS
// ============================================================================

/** The filter vocabulary every `/v1/api/*` list accepts. */
export interface ApiListParams {
  page?: number;
  /** 1–64. Clamped here so a caller can't trip the server-side clamp unawares. */
  limit?: number;
  /** Genre slug. */
  category?: string;
  /** Country slug. */
  country?: string;
  /** `2024`, or a range `2014,2024`. */
  year?: string | number;
  sort_field?: 'modified.time' | '_id' | 'year';
  sort_type?: 'desc' | 'asc';
  /** Audio track filter. */
  sort_lang?: 'vietsub' | 'thuyet-minh' | 'long-tieng';
}

function listQuery(params: ApiListParams): Record<string, QueryValue> {
  return {
    ...params,
    page: params.page && params.page > 0 ? params.page : 1,
    limit: params.limit ? Math.min(Math.max(1, params.limit), CATALOG_MAX_LIMIT) : undefined,
  };
}

async function getList(path: string, params: ApiListParams, revalidate: number): Promise<ApiPage> {
  const body = await apiFetch<ApiWrappedList | ApiFlatList>(path, listQuery(params), revalidate);
  return toPage(body, path);
}

/**
 * Newest updates across the whole catalog — the "Mới cập nhật" feed.
 *
 * The v3 variant is the only flat feed that returns full rows (type, lang,
 * quality, category) and the `updateToday` count. Fixed at 24 per page; it
 * ignores `limit`.
 */
export function getLatest(page = 1): Promise<ApiPage> {
  return getList('/danh-sach/phim-moi-cap-nhat-v3', { page }, REVALIDATE.latest);
}

/**
 * A curated list: `phim-le`, `phim-bo`, `hoat-hinh`, `tv-shows`,
 * `phim-chieu-rap`, `phim-vietsub`, `phim-thuyet-minh`, `phim-long-tieng`,
 * `subteam`. All accept the shared filters.
 */
export function listByFormat(formatSlug: string, params: ApiListParams = {}): Promise<ApiPage> {
  return getList(`/v1/api/danh-sach/${encodeURIComponent(formatSlug)}`, params, REVALIDATE.list);
}

/** The whole catalog, filtered. */
export function listAll(params: ApiListParams = {}): Promise<ApiPage> {
  return getList('/v1/api/danh-sach', params, REVALIDATE.list);
}

export function listByGenre(genreSlug: string, params: ApiListParams = {}): Promise<ApiPage> {
  return getList(`/v1/api/the-loai/${encodeURIComponent(genreSlug)}`, params, REVALIDATE.list);
}

export function listByCountry(countrySlug: string, params: ApiListParams = {}): Promise<ApiPage> {
  return getList(`/v1/api/quoc-gia/${encodeURIComponent(countrySlug)}`, params, REVALIDATE.list);
}

export function listByYear(year: number, params: ApiListParams = {}): Promise<ApiPage> {
  return getList(`/v1/api/nam/${year}`, params, REVALIDATE.list);
}

/**
 * Keyword search. Matches the Vietnamese title AND `origin_name`, so
 * "game of thrones" and "tro choi vuong quyen" both land.
 */
export function search(keyword: string, params: ApiListParams = {}): Promise<ApiPage> {
  return apiFetch<ApiWrappedList>(
    '/v1/api/tim-kiem',
    { keyword: keyword.trim(), ...listQuery(params) },
    REVALIDATE.search
  ).then((body) => toPage(body, '/v1/api/tim-kiem'));
}

// ============================================================================
// DETAIL
// ============================================================================

/**
 * One title with its servers and episodes.
 *
 * Returns null when the slug does not exist. Any other failure still throws:
 * a timeout is not the same thing as "this title is gone", and treating it
 * as one would redirect visitors away during an outage.
 */
export async function getTitle(slug: string): Promise<ApiDetailResponse | null> {
  try {
    const body = await apiFetch<ApiDetailResponse>(
      `/phim/${encodeURIComponent(slug)}`,
      {},
      REVALIDATE.detail
    );
    return body.movie ? body : null;
  } catch (err) {
    if (err instanceof CatalogApiError && err.status === 404) return null;
    throw err;
  }
}

/**
 * Look a title up by its TMDB id.
 *
 * Best-effort only: it misses for every title whose `tmdb.id` is null (about
 * a fifth of the catalog, Iron Man 3 and Game of Thrones among them), and
 * for a series it always returns the LATEST season, ignoring `?season=`.
 * Good enough to map a TMDB trending row onto something playable; not a
 * primary key.
 */
export async function getTitleByTmdb(
  type: 'movie' | 'tv',
  tmdbId: string | number
): Promise<ApiDetailResponse | null> {
  try {
    const body = await apiFetch<ApiDetailResponse>(`/tmdb/${type}/${tmdbId}`, {}, REVALIDATE.detail);
    return body.movie ? body : null;
  } catch (err) {
    if (err instanceof CatalogApiError && err.status === 404) return null;
    throw err;
  }
}

/** TMDB backdrops/posters the catalog mirrors per slug. Empty on any failure. */
export async function getImages(slug: string): Promise<ApiImagesResponse['data']['images']> {
  try {
    const body = await apiFetch<ApiImagesResponse>(
      `/v1/api/phim/${encodeURIComponent(slug)}/images`,
      {},
      REVALIDATE.extras
    );
    return body.data?.images ?? [];
  } catch {
    return [];
  }
}

/** TMDB cast/crew the catalog mirrors per slug, with profile photos. Empty on any failure. */
export async function getPeoples(slug: string): Promise<ApiPeoplesResponse['data']['peoples']> {
  try {
    const body = await apiFetch<ApiPeoplesResponse>(
      `/v1/api/phim/${encodeURIComponent(slug)}/peoples`,
      {},
      REVALIDATE.extras
    );
    return body.data?.peoples ?? [];
  } catch {
    return [];
  }
}

// ============================================================================
// TAXONOMY
// ============================================================================

/** Live genre list. The app's menu comes from `constants/catalog-taxonomy`; this is for drift checks. */
export async function getGenres(): Promise<{ name: string; slug: string }[]> {
  const body = await apiFetch<ApiTaxonomyResponse>('/the-loai', {}, REVALIDATE.taxonomy);
  return body.data.items.map(({ name, slug }) => ({ name, slug }));
}

/** Live country list. Same caveat as `getGenres`. */
export async function getCountries(): Promise<{ name: string; slug: string }[]> {
  const body = await apiFetch<ApiTaxonomyResponse>('/quoc-gia', {}, REVALIDATE.taxonomy);
  return body.data.items.map(({ name, slug }) => ({ name, slug }));
}
