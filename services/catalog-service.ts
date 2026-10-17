import 'server-only';
import type NewlyMovie from 'types/newly-movie';
import type DetailMovie from 'types/detail-movie';
import type Credit from 'types/credit';
import type MovieImage from 'types/movie-image';
import type SeasonLink from 'types/season-link';
import type { MovieFilters } from 'types/movie-filters';
import { parseSlug } from 'lib/media-key';
import {
  getLatest,
  listByFormat,
  listByGenre,
  listByCountry,
  search,
  getTitle,
  getTitleByTmdb,
  getImages,
  getPeoples,
  CatalogApiError,
  type ApiPage,
  type ApiListParams,
} from 'services/catalog-api';
import { trending } from 'services/tmdb-catalog-service';
import { enrichDetail } from 'services/tmdb-enrichment';
import {
  adaptListItems,
  adaptDetail,
  adaptPeoples,
  adaptImages,
} from 'lib/catalog-adapter';
import {
  isBrowsableGenre,
  isKnownCountry,
  isLangFilter,
  sortParams,
} from 'constants/catalog-taxonomy';

export type { MovieFilters };

/**
 * The catalog, as the rest of the app sees it.
 *
 * Everything below this module works in `NewlyMovie` / `DetailMovie`; pages
 * and server actions call only this file, so the provider behind it can
 * change without touching the UI. It changed twice already: the v1 provider → TMDB +
 * vidsrc (v2.0.0) → the current catalog API with TMDB as an extra (v3).
 *
 * The catalog hosts the streams for everything it lists, so — unlike the vidsrc
 * era — there is no availability filter: a page of 30 is 30 playable titles,
 * and the totals it reports are true.
 *
 * Failure is still a value on the home page (a dead rail renders as no
 * rail) and still an exception on browse and detail, where the failure IS
 * the page.
 */

export interface CatalogPage {
  items: NewlyMovie[];
  /** Upstream result count for this filter, or null when unknown. */
  totalItems: number | null;
  hasMore: boolean;
}

export const EMPTY_PAGE: CatalogPage = { items: [], totalItems: null, hasMore: false };

/** Grid page size. Divisible by the 2/3/5-column breakpoints. */
const BROWSE_PAGE_SIZE = 30;
const RAIL_SIZE = 14;
const HERO_SIZE = 5;

function adaptPage(page: ApiPage, locale: string): NewlyMovie[] {
  return adaptListItems(page.items, { locale, imageCdn: page.imageCdn });
}

function toCatalogPage(page: ApiPage, locale: string): CatalogPage {
  return {
    items: adaptPage(page, locale),
    totalItems: page.totalItems,
    hasMore: page.page < page.totalPages,
  };
}

/**
 * Filter-bar state → the catalog list params.
 *
 * Unknown genre/country slugs are dropped rather than forwarded: The catalog
 * answers an unknown `category` with an empty list, which would read as
 * "nothing matches" when the real problem is a stale link.
 */
function filterParams(filters: MovieFilters | undefined, page: number): ApiListParams {
  const year = filters?.year && /^\d{4}(,\d{4})?$/.test(filters.year) ? filters.year : undefined;
  return {
    page,
    limit: BROWSE_PAGE_SIZE,
    category: isBrowsableGenre(filters?.category) ? filters!.category : undefined,
    country: isKnownCountry(filters?.country) ? filters!.country : undefined,
    year,
    sort_lang: isLangFilter(filters?.lang) ? filters!.lang : undefined,
    ...sortParams(filters?.sort),
  };
}

// ============================================================================
// HOME RAILS
// ============================================================================

/**
 * Rails never throw. The home page fans several out through `Promise.all`,
 * so one rejection would take down the whole render.
 */
async function safeRail(load: () => Promise<NewlyMovie[]>): Promise<NewlyMovie[]> {
  try {
    return await load();
  } catch (err) {
    console.warn('[catalog] rail failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * "Mới cập nhật" — the catalog's own newest-first feed, plus the number of titles
 * it says were updated today (drives the daily banner). Never throws.
 */
export async function getNewlyAddedFeed(
  locale: string
): Promise<{ items: NewlyMovie[]; updatedToday: number }> {
  try {
    const page = await getLatest(1);
    return {
      items: adaptPage(page, locale).slice(0, RAIL_SIZE),
      updatedToday: page.updatedToday ?? 0,
    };
  } catch (err) {
    console.warn('[catalog] latest feed failed:', err instanceof Error ? err.message : err);
    return { items: [], updatedToday: 0 };
  }
}

export async function getNewlyAddedRail(locale: string): Promise<NewlyMovie[]> {
  return (await getNewlyAddedFeed(locale)).items;
}

/** A curated list rail: `phim-le`, `phim-bo`, `hoat-hinh`, `tv-shows`, `phim-chieu-rap`, … */
export async function getFormatRail(
  formatSlug: string,
  locale: string,
  limit = RAIL_SIZE
): Promise<NewlyMovie[]> {
  return safeRail(async () => adaptPage(await listByFormat(formatSlug, { limit }), locale));
}

export async function getGenreRail(
  genreSlug: string,
  locale: string,
  limit = RAIL_SIZE
): Promise<NewlyMovie[]> {
  return safeRail(async () => adaptPage(await listByGenre(genreSlug, { limit }), locale));
}

/**
 * The hero: what the world is watching this week, limited to what the catalog
 * can play.
 *
 * The catalog has no popularity signal, so the ranking comes from TMDB's weekly
 * trending list and each row is looked up on the catalog by TMDB id. That lookup
 * misses often — a fifth of the catalog has no TMDB id, and the newest releases
 * aren't uploaded yet — so more candidates are tried than slides shown.
 * When too few land (or TMDB is down), the newest theatrical releases fill
 * the rest: the hero should never open on a hole.
 *
 * A series resolves to its latest season, which is the one a trending list
 * means anyway.
 */
export async function getTrendingRail(locale: string, limit = HERO_SIZE): Promise<NewlyMovie[]> {
  return safeRail(async () => {
    const picked: NewlyMovie[] = [];
    const seen = new Set<string>();

    try {
      const res = await trending('all', locale);
      const candidates = res.results
        .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
        .slice(0, limit * 3);

      const settled = await Promise.allSettled(
        candidates.map((r) => getTitleByTmdb(r.media_type as 'movie' | 'tv', r.id))
      );
      for (let i = 0; i < settled.length; i++) {
        const result = settled[i];
        if (result.status !== 'fulfilled' || !result.value) continue;
        const { movie } = adaptDetail(result.value, { locale });
        if (seen.has(movie._id) || !movie.poster_url) continue;
        seen.add(movie._id);
        // The trending row already carries TMDB's primary backdrop (textless
        // for every title sampled) — a sharp hero image at no extra request.
        if (candidates[i].backdrop_path) movie.tmdb_backdrop = candidates[i].backdrop_path!;
        picked.push(movie);
        if (picked.length >= limit) break;
      }
    } catch (err) {
      console.warn('[catalog] TMDB trending unavailable:', err instanceof Error ? err.message : err);
    }

    if (picked.length < limit) {
      const fill = adaptPage(await listByFormat('phim-chieu-rap', { limit: limit * 2 }), locale);
      for (const movie of fill) {
        if (picked.length >= limit) break;
        if (seen.has(movie._id) || !movie.poster_url) continue;
        seen.add(movie._id);
        picked.push(movie);
      }
    }

    return picked;
  });
}

// ============================================================================
// BROWSE
// ============================================================================

export async function browseByGenre(
  genreSlug: string,
  page: number,
  filters: MovieFilters | undefined,
  locale: string
): Promise<CatalogPage> {
  if (!isBrowsableGenre(genreSlug)) return EMPTY_PAGE;
  const { category: _ignored, ...params } = filterParams(filters, page);
  return toCatalogPage(await listByGenre(genreSlug, params), locale);
}

export async function browseByCountry(
  countrySlug: string,
  page: number,
  filters: MovieFilters | undefined,
  locale: string
): Promise<CatalogPage> {
  if (!isKnownCountry(countrySlug)) return EMPTY_PAGE;
  const { country: _ignored, ...params } = filterParams(filters, page);
  return toCatalogPage(await listByCountry(countrySlug, params), locale);
}

export async function browseByFormat(
  formatSlug: string,
  page: number,
  filters: MovieFilters | undefined,
  locale: string
): Promise<CatalogPage> {
  return toCatalogPage(await listByFormat(formatSlug, filterParams(filters, page)), locale);
}

// ============================================================================
// SEARCH
// ============================================================================

/** Matches Vietnamese titles and original titles alike. */
export async function searchTitles(query: string, locale: string, page = 1): Promise<CatalogPage> {
  if (!query.trim()) return EMPTY_PAGE;
  return toCatalogPage(await search(query, { page, limit: BROWSE_PAGE_SIZE }), locale);
}

// ============================================================================
// DETAIL
// ============================================================================

/**
 * Resolve a URL slug to a full title.
 *
 * Two slug shapes are accepted:
 *  - a catalog slug (`nha-ngoai-giao-phan-4`) — the canonical form;
 *  - a v2.0.0 slug (`…-movie-68721` / `…-tv-1399`), from bookmarks, watch
 *    history and search engines. It is mapped by TMDB id, which works for
 *    most titles and always lands on the latest season of a series. Pages
 *    compare `detail.movie.slug` with the requested slug and redirect, so
 *    the old URL never becomes canonical.
 *
 * The result is enriched from TMDB (`services/tmdb-enrichment`).
 *
 * Returns null when neither resolves. A timeout or 5xx still throws: "the
 * provider is down" must not look like "this title does not exist".
 */
export async function getTitleDetail(slug: string, locale: string): Promise<DetailMovie | null> {
  if (!slug) return null;

  let raw = await getTitle(slug);
  if (!raw) {
    const legacy = parseSlug(slug);
    if (legacy) raw = await getTitleByTmdb(legacy.type, legacy.id);
  }
  if (!raw) return null;

  // TMDB fills what the catalog lacks (id, English text, rating, trailer);
  // time-boxed, and a no-op when TMDB is slow or down.
  return enrichDetail(adaptDetail(raw, { locale }), locale);
}

/**
 * Cast and gallery for the detail page.
 *
 * The catalog mirrors both from TMDB per slug, so this works even for titles
 * whose own `tmdb.id` is empty. Either half failing just hides its section.
 */
export async function getTitleExtras(
  slug: string
): Promise<{ credit: Credit | undefined; images: MovieImage[] }> {
  const [peoples, images] = await Promise.all([getPeoples(slug), getImages(slug)]);
  const cast = adaptPeoples(peoples);
  return {
    credit: cast.length ? { id: slug, cast } : undefined,
    images: adaptImages(images)
      .filter((img) => img.type === 'backdrop')
      .slice(0, 12),
  };
}


/** "Nhà Ngoại Giao (Phần 4)" → { base: "Nhà Ngoại Giao", season: 4 }. */
function splitSeason(name: string): { base: string; season: number } | null {
  const match = /^(.*?)\s*\((?:Phần|Season|Mùa)\s+(\d+)\)\s*$/i.exec(name.trim());
  return match ? { base: match[1].trim(), season: parseInt(match[2], 10) } : null;
}

/**
 * The other seasons of a series.
 *
 * The catalog lists every season as its own title ("Nhà Ngoại Giao (Phần 1)" …
 * "(Phần 4)") with no link between them, so siblings are found by
 * searching the shared name and keeping rows with the same "(Phần N)"
 * stem — plus the same TMDB id when both sides have one, which stops "The
 * Office (US)" from collecting "The Office (UK)". Sorted by season number.
 * Empty for films and single-season titles.
 */
export async function getOtherSeasons(detail: DetailMovie): Promise<SeasonLink[]> {
  const own = splitSeason(detail.movie.name);
  if (!own) return [];

  try {
    const res = await search(own.base, { limit: 30 });
    const ownTmdb = detail.movie.tmdb?.id;
    const seasons = new Map<number, SeasonLink>();

    for (const item of res.items) {
      const parts = splitSeason(item.name);
      if (!parts || parts.base.toLowerCase() !== own.base.toLowerCase()) continue;
      const itemTmdb = item.tmdb?.id ? String(item.tmdb.id) : null;
      if (ownTmdb && itemTmdb && itemTmdb !== ownTmdb) continue;
      if (!seasons.has(parts.season)) {
        seasons.set(parts.season, { slug: item.slug, name: item.name, season: parts.season });
      }
    }

    // Always include the current title, even if search ranked it out.
    seasons.set(own.season, { slug: detail.movie.slug, name: detail.movie.name, season: own.season });
    return seasons.size > 1 ? Array.from(seasons.values()).sort((a, b) => a.season - b.season) : [];
  } catch {
    return [];
  }
}

/**
 * "More like this" — newest titles sharing the first genre, same country
 * when there is one, minus the title itself. Best-effort: an empty array
 * hides the rail.
 */
export async function getRelatedTitles(
  detail: DetailMovie,
  locale: string,
  limit = 10
): Promise<NewlyMovie[]> {
  return safeRail(async () => {
    const genreSlug = detail.movie.category?.[0]?.slug;
    if (!genreSlug) return [];

    const page = await listByGenre(genreSlug, {
      limit: limit + 6,
      country: detail.movie.country?.[0]?.slug,
    });
    const own = splitSeason(detail.movie.name)?.base;
    return adaptPage(page, locale)
      .filter((m) => m._id !== detail.movie._id)
      // Other seasons of the same show have their own row on the page.
      .filter((m) => !own || splitSeason(m.name)?.base !== own)
      .slice(0, limit);
  });
}

/**
 * Same-genre titles for a slug from watch history ("because you watched").
 * Old v2.0.0 slugs resolve through `getTitleDetail`'s TMDB mapping.
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

export { CatalogApiError };
