/**
 * Hardcoded display name mappings for OPhim API data, keyed by slug.
 *
 * OPhim returns Vietnamese names directly in API responses (`category[].name`,
 * `country[].name`, `lang`, etc.). To support en (or future locales) without
 * a translation API, we map the canonical slug to a localized display name.
 *
 * Pattern:
 *   localizedCategory('hanh-dong', 'en') → 'Action'
 *   localizedCategory('hanh-dong', 'vi') → 'Hành Động'
 *   localizedCategory('unknown-slug', 'en') → 'unknown-slug' (fallback)
 *
 * Add new entries when OPhim introduces new categories/countries.
 * Add new locales by extending the inner objects.
 */

import type { Locale } from 'i18n/routing';

// ============================================================================
// CATEGORIES (genres)
// Slugs are stable across OPhim — derived from URL paths /v1/api/the-loai/<slug>
// ============================================================================
export const CATEGORY_MAP: Record<Locale, Record<string, string>> = {
  vi: {
    'hanh-dong': 'Hành Động',
    'co-trang': 'Cổ Trang',
    'vien-tuong': 'Viễn Tưởng',
    'kinh-di': 'Kinh Dị',
    'tai-lieu': 'Tài Liệu',
    'bi-an': 'Bí Ẩn',
    'phim-18': 'Phim 18+',
    'tinh-cam': 'Tình Cảm',
    'tam-ly': 'Tâm Lý',
    'the-thao': 'Thể Thao',
    'phieu-luu': 'Phiêu Lưu',
    'am-nhac': 'Âm Nhạc',
    'gia-dinh': 'Gia Đình',
    'hoc-duong': 'Học Đường',
    'hai-huoc': 'Hài Hước',
    'vo-thuat': 'Võ Thuật',
    'khoa-hoc': 'Khoa Học',
    'than-thoai': 'Thần Thoại',
    'chinh-kich': 'Chính Kịch',
    'kinh-dien': 'Kinh Điển',
    'hinh-su': 'Hình Sự',
    'short-drama': 'Short Drama',
  },
  en: {
    'hanh-dong': 'Action',
    'co-trang': 'Period',
    'vien-tuong': 'Sci-Fi',
    'kinh-di': 'Horror',
    'tai-lieu': 'Documentary',
    'bi-an': 'Mystery',
    'phim-18': '18+',
    'tinh-cam': 'Romance',
    'tam-ly': 'Drama',
    'the-thao': 'Sports',
    'phieu-luu': 'Adventure',
    'am-nhac': 'Music',
    'gia-dinh': 'Family',
    'hoc-duong': 'School',
    'hai-huoc': 'Comedy',
    'vo-thuat': 'Martial Arts',
    'khoa-hoc': 'Science',
    'than-thoai': 'Mythology',
    'chinh-kich': 'Drama',
    'kinh-dien': 'Classic',
    'hinh-su': 'Crime',
    'short-drama': 'Short Drama',
  },
};

// ============================================================================
// COUNTRIES
// ============================================================================
export const COUNTRY_MAP: Record<Locale, Record<string, string>> = {
  vi: {
    'trung-quoc': 'Trung Quốc',
    'han-quoc': 'Hàn Quốc',
    'nhat-ban': 'Nhật Bản',
    'thai-lan': 'Thái Lan',
    'au-my': 'Âu Mỹ',
    'dai-loan': 'Đài Loan',
    'hong-kong': 'Hồng Kông',
    'an-do': 'Ấn Độ',
    anh: 'Anh',
    phap: 'Pháp',
    canada: 'Canada',
    'quoc-gia-khac': 'Quốc Gia Khác',
    duc: 'Đức',
    'tay-ban-nha': 'Tây Ban Nha',
    'tho-nhi-ky': 'Thổ Nhĩ Kỳ',
    'ha-lan': 'Hà Lan',
    indonesia: 'Indonesia',
    nga: 'Nga',
    mexico: 'Mexico',
    'ba-lan': 'Ba Lan',
    uc: 'Úc',
    'thuy-dien': 'Thụy Điển',
    malaysia: 'Malaysia',
    brazil: 'Brazil',
    philippines: 'Philippines',
    'bo-dao-nha': 'Bồ Đào Nha',
    y: 'Ý',
    'dan-mach': 'Đan Mạch',
    uae: 'UAE',
    'na-uy': 'Na Uy',
    'thuy-si': 'Thụy Sĩ',
    'chau-phi': 'Châu Phi',
    'nam-phi': 'Nam Phi',
    ukraina: 'Ukraina',
    'a-rap-xe-ut': 'Ả Rập Xê Út',
    'viet-nam': 'Việt Nam',
  },
  en: {
    'trung-quoc': 'China',
    'han-quoc': 'South Korea',
    'nhat-ban': 'Japan',
    'thai-lan': 'Thailand',
    'au-my': 'US/Europe',
    'dai-loan': 'Taiwan',
    'hong-kong': 'Hong Kong',
    'an-do': 'India',
    anh: 'United Kingdom',
    phap: 'France',
    canada: 'Canada',
    'quoc-gia-khac': 'Other',
    duc: 'Germany',
    'tay-ban-nha': 'Spain',
    'tho-nhi-ky': 'Turkey',
    'ha-lan': 'Netherlands',
    indonesia: 'Indonesia',
    nga: 'Russia',
    mexico: 'Mexico',
    'ba-lan': 'Poland',
    uc: 'Australia',
    'thuy-dien': 'Sweden',
    malaysia: 'Malaysia',
    brazil: 'Brazil',
    philippines: 'Philippines',
    'bo-dao-nha': 'Portugal',
    y: 'Italy',
    'dan-mach': 'Denmark',
    uae: 'UAE',
    'na-uy': 'Norway',
    'thuy-si': 'Switzerland',
    'chau-phi': 'Africa',
    'nam-phi': 'South Africa',
    ukraina: 'Ukraine',
    'a-rap-xe-ut': 'Saudi Arabia',
    'viet-nam': 'Vietnam',
  },
};

// ============================================================================
// MOVIE FORMATS (header menu items)
// ============================================================================
export const FORMAT_MAP: Record<Locale, Record<string, string>> = {
  vi: {
    'phim-le': 'Phim lẻ',
    'phim-bo': 'Phim bộ',
    'hoat-hinh': 'Hoạt hình',
    'tv-shows': 'TV show',
  },
  en: {
    'phim-le': 'Movies',
    'phim-bo': 'TV Series',
    'hoat-hinh': 'Animation',
    'tv-shows': 'TV Shows',
  },
};

// ============================================================================
// MOVIE LANGUAGE LABELS (Vietsub / Thuyết Minh / Lồng Tiếng)
// OPhim returns these as raw strings in `movie.lang`. Match against the
// raw string and produce a localized version.
// ============================================================================
export const LANG_MAP: Record<Locale, Record<string, string>> = {
  vi: {
    Vietsub: 'Vietsub',
    'Thuyết Minh': 'Thuyết Minh',
    'Lồng Tiếng': 'Lồng Tiếng',
    'Vietsub + Thuyết Minh': 'Vietsub + Thuyết Minh',
    'Vietsub + Lồng Tiếng': 'Vietsub + Lồng Tiếng',
  },
  en: {
    Vietsub: 'Subbed',
    'Thuyết Minh': 'Voiceover',
    'Lồng Tiếng': 'Dubbed',
    'Vietsub + Thuyết Minh': 'Sub + Voiceover',
    'Vietsub + Lồng Tiếng': 'Sub + Dubbed',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// All helpers fall back to the slug itself when no mapping is found, so the
// UI degrades gracefully rather than rendering "undefined".
// ============================================================================

export function localizedCategory(slug: string, locale: Locale): string {
  return CATEGORY_MAP[locale]?.[slug] ?? CATEGORY_MAP.vi[slug] ?? slug;
}

export function localizedCountry(slug: string, locale: Locale): string {
  return COUNTRY_MAP[locale]?.[slug] ?? COUNTRY_MAP.vi[slug] ?? slug;
}

export function localizedFormat(slug: string, locale: Locale): string {
  return FORMAT_MAP[locale]?.[slug] ?? FORMAT_MAP.vi[slug] ?? slug;
}

export function localizedLang(rawLang: string, locale: Locale): string {
  return LANG_MAP[locale]?.[rawLang] ?? LANG_MAP.vi[rawLang] ?? rawLang;
}

// ============================================================================
// PATTERN-BASED LOCALIZERS
// OPhim returns predictable Vietnamese strings for `time` and `episode_current`.
// We localize them via deterministic regex replacement → no API call cost.
// ============================================================================

/**
 * Localize duration strings.
 *
 *   "45 phút/tập"        → "45 min/ep"
 *   "117 Phút"           → "117 mins"
 *   "? phút/tập"         → "? min/ep"
 *   "1 giờ 30 phút"      → "1 hr 30 min"
 *
 * Returns the original string unchanged for `vi` locale or unrecognized formats.
 */
export function localizedTime(time: string | undefined, locale: Locale): string {
  if (!time) return '';
  if (locale === 'vi') return time;

  if (locale === 'en') {
    return time
      .replace(/phút\/tập/gi, 'min/ep')
      .replace(/giờ/gi, 'hr')
      .replace(/\bphút\b/gi, 'min')
      .replace(/\bPhút\b/g, 'mins'); // capitalized form (e.g., "117 Phút") usually means total minutes
  }

  return time;
}

/**
 * Localize episode status strings.
 *
 *   "Tập 4"                  → "Ep 4"
 *   "Tập đặc biệt"           → "Special"
 *   "Hoàn tất (10/10)"       → "Completed (10/10)"
 *   "Trailer"                → "Trailer" (universal, kept as-is)
 *   "Full"                   → "Full" (universal)
 *
 * Returns original on locale `vi` or no pattern match.
 */
export function localizedEpisodeCurrent(
  episodeCurrent: string | undefined,
  locale: Locale
): string {
  if (!episodeCurrent) return '';
  if (locale === 'vi') return episodeCurrent;

  if (locale === 'en') {
    return episodeCurrent
      .replace(/^Hoàn tất\s*\(([^)]+)\)$/i, 'Completed ($1)')
      .replace(/^Tập đặc biệt$/i, 'Special')
      .replace(/^Tập\s+(\S+)/i, 'Ep $1');
  }

  return episodeCurrent;
}

/**
 * Pick the locale-appropriate movie display title.
 *
 * Strategy: avoid spending Groq API quota on translating titles. Instead,
 * for non-vi locales prefer `origin_name` (already in the source language for
 * most movies — "Your Friends & Neighbors", "The Bangkok Red Opera", etc.).
 *
 * Returns the raw `name` for `vi` locale or when `origin_name` is missing.
 */
export function preferredTitle(
  name: string,
  origin_name: string | undefined,
  locale: Locale
): string {
  if (locale === 'vi') return name;
  return origin_name?.trim() || name;
}

/**
 * The "secondary" title shown beneath the primary one — flips with `preferredTitle`.
 */
export function secondaryTitle(
  name: string,
  origin_name: string | undefined,
  locale: Locale
): string {
  if (locale === 'vi') return origin_name ?? '';
  // For non-vi: name (Vietnamese) is the secondary; if origin_name was missing
  // primary already used `name`, so show nothing here to avoid duplicate.
  return origin_name?.trim() ? name : '';
}
