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
    'anh': 'Anh',
    'phap': 'Pháp',
    'canada': 'Canada',
    'quoc-gia-khac': 'Quốc Gia Khác',
    'duc': 'Đức',
    'tay-ban-nha': 'Tây Ban Nha',
    'tho-nhi-ky': 'Thổ Nhĩ Kỳ',
    'ha-lan': 'Hà Lan',
    'indonesia': 'Indonesia',
    'nga': 'Nga',
    'mexico': 'Mexico',
    'ba-lan': 'Ba Lan',
    'uc': 'Úc',
    'thuy-dien': 'Thụy Điển',
    'malaysia': 'Malaysia',
    'brazil': 'Brazil',
    'philippines': 'Philippines',
    'bo-dao-nha': 'Bồ Đào Nha',
    'y': 'Ý',
    'dan-mach': 'Đan Mạch',
    'uae': 'UAE',
    'na-uy': 'Na Uy',
    'thuy-si': 'Thụy Sĩ',
    'chau-phi': 'Châu Phi',
    'nam-phi': 'Nam Phi',
    'ukraina': 'Ukraina',
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
    'anh': 'United Kingdom',
    'phap': 'France',
    'canada': 'Canada',
    'quoc-gia-khac': 'Other',
    'duc': 'Germany',
    'tay-ban-nha': 'Spain',
    'tho-nhi-ky': 'Turkey',
    'ha-lan': 'Netherlands',
    'indonesia': 'Indonesia',
    'nga': 'Russia',
    'mexico': 'Mexico',
    'ba-lan': 'Poland',
    'uc': 'Australia',
    'thuy-dien': 'Sweden',
    'malaysia': 'Malaysia',
    'brazil': 'Brazil',
    'philippines': 'Philippines',
    'bo-dao-nha': 'Portugal',
    'y': 'Italy',
    'dan-mach': 'Denmark',
    'uae': 'UAE',
    'na-uy': 'Norway',
    'thuy-si': 'Switzerland',
    'chau-phi': 'Africa',
    'nam-phi': 'South Africa',
    'ukraina': 'Ukraine',
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
    'Vietsub': 'Vietsub',
    'Thuyết Minh': 'Thuyết Minh',
    'Lồng Tiếng': 'Lồng Tiếng',
    'Vietsub + Thuyết Minh': 'Vietsub + Thuyết Minh',
    'Vietsub + Lồng Tiếng': 'Vietsub + Lồng Tiếng',
  },
  en: {
    'Vietsub': 'Subbed',
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
