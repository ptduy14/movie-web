/**
 * Canonical taxonomy for the TMDB-backed catalog.
 *
 * This file is the single source of truth for the genre and country slugs
 * that appear in URLs (`/movies/type/<slug>`, `/movies/country/<slug>`) and
 * in `constants/i18n-mappings.ts` display maps.
 *
 * Why slugs at all, when TMDB works in numeric genre ids and ISO country
 * codes? Because the URL space is user-facing and permanent: `/movies/type/
 * hanh-dong` reads better than `/movies/type/28`, survives a future provider
 * swap, and keeps the Vietnamese identity of the site in its links.
 *
 * Genre ids verified live against `/3/genre/{movie,tv}/list` on 2026-09-20.
 * Movie and TV have DIFFERENT genre vocabularies that partially overlap
 * (both use 16/35/80/99/18/10751/9648/37) — hence the separate maps.
 */

/** TMDB media type. The catalog has exactly these two. */
export type MediaType = 'movie' | 'tv';

// ============================================================================
// GENRES
// ============================================================================

/**
 * Movie genre slug → TMDB genre id.
 *
 * Naming note: Vietnamese distinguishes "Viễn Tưởng" (science fiction) from
 * "Giả Tưởng" (fantasy); TMDB's own vi-VN labels use the same split. We keep
 * `vien-tuong` on Sci-Fi (878) because that is how the slug was used before
 * the migration, and give Fantasy (14) the new `gia-tuong`.
 */
export const MOVIE_GENRE_SLUG_TO_ID: Record<string, number> = {
  'hanh-dong': 28, // Action
  'phieu-luu': 12, // Adventure
  'hoat-hinh': 16, // Animation
  'hai-huoc': 35, // Comedy
  'hinh-su': 80, // Crime
  'tai-lieu': 99, // Documentary
  'chinh-kich': 18, // Drama
  'gia-dinh': 10751, // Family
  'gia-tuong': 14, // Fantasy
  'lich-su': 36, // History
  'kinh-di': 27, // Horror
  'am-nhac': 10402, // Music
  'bi-an': 9648, // Mystery
  'tinh-cam': 10749, // Romance
  'vien-tuong': 878, // Science Fiction
  'gay-can': 53, // Thriller
  'chien-tranh': 10752, // War
  'mien-tay': 37, // Western
};

/**
 * TV genre slug → TMDB genre id.
 *
 * TMDB collapses several movie genres for TV (Action & Adventure, Sci-Fi &
 * Fantasy, War & Politics). Slugs that exist in both maps resolve to the
 * right id automatically via `genreIdForSlug(slug, mediaType)`.
 */
export const TV_GENRE_SLUG_TO_ID: Record<string, number> = {
  'hanh-dong': 10759, // Action & Adventure — closest TV equivalent of 28/12
  'phieu-luu': 10759,
  'hoat-hinh': 16,
  'hai-huoc': 35,
  'hinh-su': 80,
  'tai-lieu': 99,
  'chinh-kich': 18,
  'gia-dinh': 10751,
  'gia-tuong': 10765, // Sci-Fi & Fantasy
  'vien-tuong': 10765,
  'bi-an': 9648,
  'mien-tay': 37,
  'thieu-nhi': 10762, // Kids
  'thoi-su': 10763, // News
  'truyen-hinh-thuc-te': 10764, // Reality
  'phim-dai': 10766, // Soap
  talkshow: 10767, // Talk
  'chien-tranh': 10768, // War & Politics
};

/**
 * Reverse lookup: TMDB genre id → slug, per media type. Built once at module
 * load. Where several slugs share an id (TV 10759 ← hanh-dong + phieu-luu),
 * the FIRST slug declared wins, which is why the broader term is listed first
 * in each map above.
 */
function buildIdToSlug(map: Record<string, number>): Record<number, string> {
  const out: Record<number, string> = {};
  for (const [slug, id] of Object.entries(map)) {
    if (out[id] === undefined) out[id] = slug;
  }
  return out;
}

export const MOVIE_GENRE_ID_TO_SLUG = buildIdToSlug(MOVIE_GENRE_SLUG_TO_ID);
export const TV_GENRE_ID_TO_SLUG = buildIdToSlug(TV_GENRE_SLUG_TO_ID);

/** All genre slugs that should appear in browse menus, in display order. */
export const BROWSE_GENRE_SLUGS: string[] = [
  'hanh-dong',
  'phieu-luu',
  'hai-huoc',
  'chinh-kich',
  'kinh-di',
  'tinh-cam',
  'vien-tuong',
  'gia-tuong',
  'hinh-su',
  'bi-an',
  'gay-can',
  'hoat-hinh',
  'gia-dinh',
  'chien-tranh',
  'lich-su',
  'am-nhac',
  'tai-lieu',
  'mien-tay',
];

/**
 * Resolve a slug to the TMDB genre id for a given media type.
 * Returns `undefined` when the genre does not exist for that media type
 * (e.g. `talkshow` on movies) so callers can skip the filter rather than
 * sending a bogus id.
 */
export function genreIdForSlug(slug: string, mediaType: MediaType): number | undefined {
  return mediaType === 'tv' ? TV_GENRE_SLUG_TO_ID[slug] : MOVIE_GENRE_SLUG_TO_ID[slug];
}

/** Resolve a TMDB genre id back to its slug. Falls back to `String(id)`. */
export function slugForGenreId(id: number, mediaType: MediaType): string {
  const map = mediaType === 'tv' ? TV_GENRE_ID_TO_SLUG : MOVIE_GENRE_ID_TO_SLUG;
  return map[id] ?? String(id);
}

// ============================================================================
// COUNTRIES
// ============================================================================

/**
 * Country slug → ISO 3166-1 alpha-2, as used by TMDB `origin_country` and
 * the discover `with_origin_country` filter.
 *
 * `au-my` from the OPhim era is gone: it meant "US + Europe", which has no
 * ISO equivalent and cannot be expressed as a discover filter. It is replaced
 * by `hoa-ky` (US) plus the individual European entries.
 */
export const COUNTRY_SLUG_TO_ISO: Record<string, string> = {
  'viet-nam': 'VN',
  'hoa-ky': 'US',
  'han-quoc': 'KR',
  'trung-quoc': 'CN',
  'nhat-ban': 'JP',
  'thai-lan': 'TH',
  'dai-loan': 'TW',
  'hong-kong': 'HK',
  'an-do': 'IN',
  anh: 'GB',
  phap: 'FR',
  duc: 'DE',
  y: 'IT',
  'tay-ban-nha': 'ES',
  canada: 'CA',
  uc: 'AU',
  nga: 'RU',
  'tho-nhi-ky': 'TR',
  'ha-lan': 'NL',
  indonesia: 'ID',
  philippines: 'PH',
  malaysia: 'MY',
  singapore: 'SG',
  mexico: 'MX',
  brazil: 'BR',
  'ba-lan': 'PL',
  'thuy-dien': 'SE',
  'dan-mach': 'DK',
  'na-uy': 'NO',
  'thuy-si': 'CH',
  'bo-dao-nha': 'PT',
  'nam-phi': 'ZA',
  ukraina: 'UA',
  'a-rap-xe-ut': 'SA',
  uae: 'AE',
  'argentina': 'AR',
};

export const ISO_TO_COUNTRY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_SLUG_TO_ISO).map(([slug, iso]) => [iso, slug])
);

/** Country slugs offered in the filter bar / browse menus, in display order. */
export const BROWSE_COUNTRY_SLUGS: string[] = [
  'viet-nam',
  'hoa-ky',
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
];

export function isoForCountrySlug(slug: string): string | undefined {
  return COUNTRY_SLUG_TO_ISO[slug];
}

/**
 * ISO code → slug. Unknown codes return the lowercased ISO itself so the UI
 * degrades to "us"/"fr" rather than "undefined"; `localizedCountry()` then
 * falls back to showing that raw string.
 */
export function countrySlugForIso(iso: string | undefined | null): string {
  if (!iso) return '';
  return ISO_TO_COUNTRY_SLUG[iso] ?? iso.toLowerCase();
}

// ============================================================================
// FORMATS  (the header menu: Phim lẻ / Phim bộ / Hoạt hình / TV show)
// ============================================================================

export interface FormatDefinition {
  /** Which TMDB media types the format draws from. Two entries = merged list. */
  mediaTypes: MediaType[];
  /** Genre ids required on top of the media type, per media type. */
  genreIds?: Partial<Record<MediaType, number[]>>;
}

/**
 * The four browse formats, expressed as TMDB discover constraints.
 *
 * `hoat-hinh` deliberately spans BOTH media types — "hoạt hình" in Vietnamese
 * covers animated films and animated series alike, and restricting it to one
 * would silently hide half the catalog. The catalog service interleaves the
 * two discover calls; see `discoverByFormat`.
 *
 * `tv-shows` means unscripted television (reality / talk / news), which is
 * what distinguishes it from `phim-bo` (scripted series).
 */
export const FORMAT_DEFINITIONS: Record<string, FormatDefinition> = {
  'phim-le': { mediaTypes: ['movie'] },
  'phim-bo': { mediaTypes: ['tv'] },
  'hoat-hinh': {
    mediaTypes: ['movie', 'tv'],
    genreIds: { movie: [16], tv: [16] },
  },
  'tv-shows': {
    mediaTypes: ['tv'],
    genreIds: { tv: [10764, 10767, 10763] }, // Reality, Talk, News
  },
};

export const BROWSE_FORMAT_SLUGS = Object.keys(FORMAT_DEFINITIONS);

export function formatDefinition(slug: string): FormatDefinition | undefined {
  return FORMAT_DEFINITIONS[slug];
}
