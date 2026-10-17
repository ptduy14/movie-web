/**
 * Canonical taxonomy for the catalog.
 *
 * Unlike TMDB, the catalog already speaks slugs — `/v1/api/the-loai/hanh-dong`,
 * `?country=han-quoc` — so there is no id mapping here, only the decision of
 * which of its slugs the site exposes, in what order, and where the slugs
 * from the TMDB era should land.
 *
 * Export names mirror `constants/tmdb-taxonomy.ts` on purpose: moving a
 * consumer over is an import-path change, not a rename.
 *
 * Slug lists verified live against `/the-loai` and `/quoc-gia` on 2026-10-16.
 * `getGenres()` / `getCountries()` in `services/catalog-api.ts` return the
 * live lists if this file ever needs re-checking.
 */

import type { ApiType } from 'types/catalog-api';

// ============================================================================
// GENRES
// ============================================================================

/** Every genre slug the catalog serves (26). */
export const GENRE_SLUGS = [
  'hanh-dong',
  'phieu-luu',
  'hai-huoc',
  'chinh-kich',
  'tam-ly',
  'tinh-cam',
  'kinh-di',
  'bi-an',
  'hinh-su',
  'vien-tuong',
  'than-thoai',
  'co-trang',
  'vo-thuat',
  'chien-tranh',
  'lich-su',
  'gia-dinh',
  'tre-em',
  'hoc-duong',
  'the-thao',
  'am-nhac',
  'tai-lieu',
  'khoa-hoc',
  'kinh-dien',
  'mien-tay',
  'phim-ngan',
  'phim-18',
] as const;

/**
 * Genres that exist upstream but never appear in a menu, a chip, or a home
 * rail. Their browse route 404s.
 */
export const HIDDEN_GENRE_SLUGS: ReadonlySet<string> = new Set(['phim-18']);

/** Genres offered in the header menu and filter bar, in display order. */
export const BROWSE_GENRE_SLUGS: string[] = GENRE_SLUGS.filter(
  (slug) => !HIDDEN_GENRE_SLUGS.has(slug)
);

const GENRE_SET: ReadonlySet<string> = new Set(GENRE_SLUGS);

/**
 * True for a slug the site shows.
 *
 * Item `category[]` arrays leak TMDB's English genre slugs alongside the
 * Vietnamese ones (`war-politics` / "War & Politics" on The Diplomat), so the
 * adapter runs every chip through this.
 */
export function isBrowsableGenre(slug: string | undefined | null): boolean {
  return !!slug && GENRE_SET.has(slug) && !HIDDEN_GENRE_SLUGS.has(slug);
}

// ============================================================================
// COUNTRIES
// ============================================================================

/**
 * Every country slug the catalog serves (36). `au-my` is back: The catalog groups the
 * US and most of Europe under "Âu Mỹ", which the TMDB era had split into
 * `hoa-ky` + individual countries.
 */
export const COUNTRY_SLUGS = [
  'viet-nam',
  'au-my',
  'han-quoc',
  'trung-quoc',
  'nhat-ban',
  'thai-lan',
  'dai-loan',
  'hong-kong',
  'an-do',
  'anh',
  'phap',
  'duc',
  'y',
  'tay-ban-nha',
  'canada',
  'uc',
  'nga',
  'tho-nhi-ky',
  'indonesia',
  'philippines',
  'malaysia',
  'mexico',
  'brazil',
  'ha-lan',
  'ba-lan',
  'thuy-dien',
  'dan-mach',
  'na-uy',
  'thuy-si',
  'bo-dao-nha',
  'ukraina',
  'nam-phi',
  'chau-phi',
  'a-rap-xe-ut',
  'uae',
  'quoc-gia-khac',
] as const;

/** Countries offered in the menus and filter bar, in display order. */
export const BROWSE_COUNTRY_SLUGS: string[] = COUNTRY_SLUGS.slice(0, 20);

const COUNTRY_SET: ReadonlySet<string> = new Set(COUNTRY_SLUGS);

export function isKnownCountry(slug: string | undefined | null): boolean {
  return !!slug && COUNTRY_SET.has(slug);
}

// ============================================================================
// FORMATS  (curated `/v1/api/danh-sach/{slug}` lists)
// ============================================================================

/** The header-menu formats. Same four as before, so old links keep working. */
export const BROWSE_FORMAT_SLUGS = ['phim-le', 'phim-bo', 'hoat-hinh', 'tv-shows'] as const;

/**
 * Extra curated lists the catalog has and TMDB never did. Browsable routes, and
 * the source of the "Chiếu rạp" / "Thuyết minh" / "Lồng tiếng" home rails.
 */
export const EXTRA_FORMAT_SLUGS = [
  'phim-chieu-rap',
  'phim-thuyet-minh',
  'phim-long-tieng',
] as const;

export const FORMAT_SLUGS: string[] = [...BROWSE_FORMAT_SLUGS, ...EXTRA_FORMAT_SLUGS];

const FORMAT_SET: ReadonlySet<string> = new Set(FORMAT_SLUGS);

export function isKnownFormat(slug: string | undefined | null): boolean {
  return !!slug && FORMAT_SET.has(slug);
}

/** The browse format a title belongs to, from its catalog `type`. */
export function formatForType(type: ApiType | undefined): string {
  switch (type) {
    case 'series':
      return 'phim-bo';
    case 'hoathinh':
      return 'hoat-hinh';
    case 'tvshows':
      return 'tv-shows';
    default:
      return 'phim-le';
  }
}

// ============================================================================
// LEGACY SLUGS  (TMDB era → the catalog)
// ============================================================================

/**
 * Slugs that were live under v2.0.0 and have no catalog equivalent of the
 * same name. Browse routes 301 these instead of 404-ing old links. The
 * mappings are nearest-neighbour, not exact: The catalog has no Fantasy or
 * Thriller genre, so those land on the closest one it does have.
 */
export const LEGACY_GENRE_REDIRECTS: Record<string, string> = {
  'gia-tuong': 'vien-tuong', // Fantasy → Viễn Tưởng
  'gay-can': 'hinh-su', // Thriller → Hình Sự
  'thieu-nhi': 'tre-em', // Kids
};

export const LEGACY_COUNTRY_REDIRECTS: Record<string, string> = {
  'hoa-ky': 'au-my',
};

// ============================================================================
// SORT & AUDIO FILTERS
// ============================================================================

export interface ApiSortParams {
  sort_field?: 'modified.time' | 'year';
  sort_type?: 'desc' | 'asc';
}

/**
 * Translate the filter bar's `sort` token into the catalog params.
 *
 * `''` means "recently updated", which is the catalog's default and the order its
 * own site uses. `rating_desc` is not supported upstream (there is no rating
 * sort) and is treated as the default rather than faked client-side over a
 * single page.
 */
export function sortParams(sort: string | undefined): ApiSortParams {
  if (sort === 'year_desc') return { sort_field: 'year', sort_type: 'desc' };
  if (sort === 'year_asc') return { sort_field: 'year', sort_type: 'asc' };
  return {};
}

/** Audio filter tokens, as both the URL and the catalog's `sort_lang` spell them. */
export const LANG_FILTER_SLUGS = ['vietsub', 'thuyet-minh', 'long-tieng'] as const;
export type LangFilter = (typeof LANG_FILTER_SLUGS)[number];

export function isLangFilter(value: string | undefined | null): value is LangFilter {
  return !!value && (LANG_FILTER_SLUGS as readonly string[]).includes(value);
}
