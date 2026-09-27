import type {
  TmdbPagedResponse,
  TmdbListItem,
  TmdbMovieDetail,
  TmdbTvDetail,
  TmdbSeasonDetail,
} from 'types/tmdb-api';
import type { MediaType } from 'constants/tmdb-taxonomy';
import { genreIdForSlug, isoForCountrySlug, formatDefinition } from 'constants/tmdb-taxonomy';

/**
 * Raw TMDB catalog access. One place that knows about auth, timeouts,
 * language codes and pagination; everything above it works in app types via
 * `lib/tmdb-adapter.ts`.
 *
 * Every response is guarded. The previous provider layer called a bare
 * `res.json()` in all twelve methods, so the day the upstream started
 * answering 404-with-HTML, the app threw `SyntaxError: Unexpected token '<'`
 * from inside a React Server Component render and returned a blank 200.
 * `tmdbFetch` refuses to repeat that: non-OK status and non-JSON bodies both
 * become a typed `TmdbError` that callers can catch and degrade on.
 */

const TMDB_BASE = 'https://api.themoviedb.org/3';
const ACCESS_TOKEN = process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN;
const TIMEOUT_MS = 8000;

/** Cache windows. The catalog moves slowly; ratings and discover order don't
 *  need to be fresh to the second, and Vercel bills by function duration. */
const REVALIDATE = {
  /** Browse/discover/trending lists. */
  list: 60 * 30, // 30 min
  /** Title detail — synopsis, cast, runtime. */
  detail: 60 * 60 * 6, // 6 h
  /** Season episode lists — effectively immutable once aired. */
  season: 60 * 60 * 24, // 24 h
  /** Search: short, because a user retrying a typo'd query wants fresh hits. */
  search: 60 * 5, // 5 min
} as const;

export class TmdbError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly path: string
  ) {
    super(message);
    this.name = 'TmdbError';
  }
}

/** Map an app locale onto a TMDB `language` code. */
export function tmdbLanguage(locale: string | undefined): string {
  return locale === 'vi' ? 'vi-VN' : 'en-US';
}

type QueryValue = string | number | boolean | undefined | null;

async function tmdbFetch<T>(
  path: string,
  params: Record<string, QueryValue> = {},
  revalidate: number = REVALIDATE.list
): Promise<T> {
  if (!ACCESS_TOKEN) {
    throw new TmdbError('NEXT_PUBLIC_TMDB_ACCESS_TOKEN is not set', 0, path);
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }

  const url = `${TMDB_BASE}${path}${search.toString() ? `?${search}` : ''}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      signal: controller.signal,
      next: { revalidate },
    });

    if (!res.ok) {
      throw new TmdbError(`TMDB responded ${res.status}`, res.status, path);
    }

    // A proxy or error page can answer 200 with HTML. Check before parsing so
    // the failure reads as "upstream misbehaved", not as a JSON syntax error
    // thrown from somewhere deep in a render.
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new TmdbError(`TMDB returned non-JSON (${contentType || 'no content-type'})`, res.status, path);
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof TmdbError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new TmdbError(`TMDB timed out after ${TIMEOUT_MS}ms`, 408, path);
    }
    throw new TmdbError(err instanceof Error ? err.message : 'TMDB request failed', 0, path);
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================================
// DISCOVER
// ============================================================================

export interface DiscoverOptions {
  mediaType: MediaType;
  locale?: string;
  page?: number;
  /** Genre slug from `constants/tmdb-taxonomy`. Ignored if the genre does not
   *  exist for this media type. */
  genreSlug?: string;
  /** Explicit TMDB genre ids — used by format definitions. OR-ed together. */
  genreIds?: number[];
  countrySlug?: string;
  year?: string | number;
  /** `''` | `'year_desc'` | `'year_asc'` — the vocabulary the filter bar writes. */
  sort?: string;
}

/**
 * Translate the filter bar's `sort` token into a TMDB `sort_by` value.
 *
 * TMDB names the date field differently per media type, which is why this
 * needs the media type rather than being a plain lookup table. Anything
 * unrecognized (including `''`) falls back to popularity, TMDB's own default
 * and the only sensible ordering for an unfiltered browse page.
 */
function sortBy(sort: string | undefined, mediaType: MediaType): string {
  const dateField = mediaType === 'tv' ? 'first_air_date' : 'primary_release_date';
  if (sort === 'year_desc') return `${dateField}.desc`;
  if (sort === 'year_asc') return `${dateField}.asc`;
  if (sort === 'rating_desc') return 'vote_average.desc';
  return 'popularity.desc';
}

export async function discover(opts: DiscoverOptions): Promise<TmdbPagedResponse> {
  const { mediaType, locale, page = 1, genreSlug, genreIds, countrySlug, year, sort } = opts;

  const genres: number[] = [];
  if (genreIds?.length) genres.push(...genreIds);
  if (genreSlug) {
    const id = genreIdForSlug(genreSlug, mediaType);
    if (id !== undefined) genres.push(id);
  }

  const yearParam = mediaType === 'tv' ? 'first_air_date_year' : 'primary_release_year';

  return tmdbFetch<TmdbPagedResponse>(`/discover/${mediaType}`, {
    language: tmdbLanguage(locale),
    page,
    sort_by: sortBy(sort, mediaType),
    // Comma = AND, pipe = OR. Format definitions ("TV show" = reality OR talk
    // OR news) need OR; a single genre filter is unaffected either way.
    with_genres: genres.length ? genres.join('|') : undefined,
    with_origin_country: countrySlug ? isoForCountrySlug(countrySlug) : undefined,
    [yearParam]: year || undefined,
    include_adult: false,
    // Titles with no votes at all are overwhelmingly data-entry stubs with no
    // poster. They would pass the availability filter only to render as grey
    // boxes, so they are cheaper to exclude here than to filter downstream.
    'vote_count.gte': sort === 'rating_desc' ? 50 : undefined,
  });
}

/**
 * Discover for a browse "format" (`phim-le`, `phim-bo`, `hoat-hinh`, `tv-shows`).
 *
 * `hoat-hinh` spans both media types, so it issues two discover calls and
 * interleaves them — a page therefore holds up to 40 items rather than 20,
 * and `total_results` is the sum. Interleaving (rather than concatenating)
 * matters: concatenation would render every animated film before the first
 * animated series, which looks broken on a grid.
 */
export async function discoverByFormat(
  formatSlug: string,
  opts: Omit<DiscoverOptions, 'mediaType'> = {}
): Promise<TmdbPagedResponse & { mediaTypeByIndex: MediaType[] }> {
  const def = formatDefinition(formatSlug);
  if (!def) {
    return { page: 1, results: [], total_pages: 0, total_results: 0, mediaTypeByIndex: [] };
  }

  const responses = await Promise.all(
    def.mediaTypes.map((mediaType) =>
      discover({ ...opts, mediaType, genreIds: def.genreIds?.[mediaType] })
        .then((res) => ({ mediaType, res }))
        .catch(() => ({ mediaType, res: null as TmdbPagedResponse | null }))
    )
  );

  const alive = responses.filter((r) => r.res !== null) as {
    mediaType: MediaType;
    res: TmdbPagedResponse;
  }[];

  if (alive.length === 0) {
    throw new TmdbError('all discover calls failed', 0, `/discover[${formatSlug}]`);
  }

  const results: TmdbListItem[] = [];
  const mediaTypeByIndex: MediaType[] = [];
  const longest = Math.max(...alive.map((r) => r.res.results.length));
  for (let i = 0; i < longest; i++) {
    for (const { mediaType, res } of alive) {
      const item = res.results[i];
      if (!item) continue;
      results.push(item);
      mediaTypeByIndex.push(mediaType);
    }
  }

  return {
    page: opts.page ?? 1,
    results,
    total_pages: Math.max(...alive.map((r) => r.res.total_pages)),
    total_results: alive.reduce((sum, r) => sum + r.res.total_results, 0),
    mediaTypeByIndex,
  };
}

// ============================================================================
// TRENDING / SEARCH
// ============================================================================

export async function trending(
  mediaType: MediaType | 'all',
  locale?: string,
  window: 'day' | 'week' = 'week'
): Promise<TmdbPagedResponse> {
  return tmdbFetch<TmdbPagedResponse>(`/trending/${mediaType}/${window}`, {
    language: tmdbLanguage(locale),
  });
}

/**
 * Multi-search across movies and TV.
 *
 * `person` results are dropped by the caller (they carry no playable id);
 * they are not filtered here because TMDB's `total_results` counts them and
 * the two numbers should stay consistent with what the API said.
 */
export async function searchMulti(
  query: string,
  locale?: string,
  page = 1
): Promise<TmdbPagedResponse> {
  if (!query.trim()) {
    return { page: 1, results: [], total_pages: 0, total_results: 0 };
  }
  return tmdbFetch<TmdbPagedResponse>(
    '/search/multi',
    { query, language: tmdbLanguage(locale), page, include_adult: false },
    REVALIDATE.search
  );
}

// ============================================================================
// DETAIL
// ============================================================================

/**
 * Full title detail in one round trip.
 *
 * `append_to_response` folds external ids and credits into the same request.
 * Videos are NOT appended: TMDB filters `videos` by the `language` param, and
 * a vi-VN request returns an empty array even for titles with an English
 * trailer (verified on Iron Man 3). Trailers come from `getVideos()` instead.
 */
export async function getMovieDetail(id: string | number, locale?: string): Promise<TmdbMovieDetail> {
  return tmdbFetch<TmdbMovieDetail>(
    `/movie/${id}`,
    { language: tmdbLanguage(locale), append_to_response: 'external_ids,credits' },
    REVALIDATE.detail
  );
}

export async function getTvDetail(id: string | number, locale?: string): Promise<TmdbTvDetail> {
  return tmdbFetch<TmdbTvDetail>(
    `/tv/${id}`,
    { language: tmdbLanguage(locale), append_to_response: 'external_ids,credits' },
    REVALIDATE.detail
  );
}

export async function getDetail(
  type: MediaType,
  id: string | number,
  locale?: string
): Promise<TmdbMovieDetail | TmdbTvDetail> {
  return type === 'tv' ? getTvDetail(id, locale) : getMovieDetail(id, locale);
}

export async function getSeason(
  tvId: string | number,
  seasonNumber: number,
  locale?: string
): Promise<TmdbSeasonDetail> {
  return tmdbFetch<TmdbSeasonDetail>(
    `/tv/${tvId}/season/${seasonNumber}`,
    { language: tmdbLanguage(locale) },
    REVALIDATE.season
  );
}

/**
 * YouTube trailer key for a title, or null.
 *
 * Asks in the app locale first and falls back to `en-US`, because most
 * titles only have an English-tagged trailer. Prefers an official Trailer,
 * then any trailer, then a teaser.
 */
export async function getTrailerKey(
  type: MediaType,
  id: string | number,
  locale?: string
): Promise<string | null> {
  const pick = (videos: { results?: { key: string; site: string; type: string; official?: boolean }[] }) => {
    const yt = (videos.results ?? []).filter((v) => v.site === 'YouTube');
    return (
      yt.find((v) => v.type === 'Trailer' && v.official)?.key ??
      yt.find((v) => v.type === 'Trailer')?.key ??
      yt.find((v) => v.type === 'Teaser')?.key ??
      null
    );
  };

  const languages = locale === 'vi' ? ['vi-VN', 'en-US'] : ['en-US'];
  for (const language of languages) {
    try {
      const res = await tmdbFetch<{ results?: { key: string; site: string; type: string; official?: boolean }[] }>(
        `/${type}/${id}/videos`,
        { language },
        REVALIDATE.detail
      );
      const key = pick(res);
      if (key) return key;
    } catch {
      // Trailers are decorative — try the next language, then give up.
    }
  }
  return null;
}
