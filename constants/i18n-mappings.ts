/**
 * Display names for catalog taxonomy, keyed by slug.
 *
 * The slugs are the catalog's (`constants/catalog-taxonomy.ts`); this file turns
 * them into words a person reads, in each locale. The catalog does send its own
 * Vietnamese names, but only Vietnamese, and a few of them are TMDB's English
 * genre names leaking through — so the site keeps its own.
 *
 * Pattern:
 *   localizedCategory('hanh-dong', 'en') → 'Action'
 *   localizedCategory('hanh-dong', 'vi') → 'Hành Động'
 *   localizedCategory('unknown-slug', 'en') → 'unknown-slug' (fallback)
 *
 * A few TMDB-era slugs (`gia-tuong`, `hoa-ky`, `talkshow`…) are still named
 * here: v2 watch history and collections may carry them in chips, and the
 * browse routes redirect them to their catalog equivalents. A missing entry
 * degrades to the raw slug rather than throwing.
 */

import type { Locale } from 'i18n/routing';

// ============================================================================
// CATEGORIES (genres)
// ============================================================================
export const CATEGORY_MAP: Record<Locale, Record<string, string>> = {
  vi: {
    'hanh-dong': 'Hành Động',
    'phieu-luu': 'Phiêu Lưu',
    'hoat-hinh': 'Hoạt Hình',
    'hai-huoc': 'Hài Hước',
    'hinh-su': 'Hình Sự',
    'tai-lieu': 'Tài Liệu',
    'chinh-kich': 'Chính Kịch',
    'gia-dinh': 'Gia Đình',
    'gia-tuong': 'Giả Tưởng',
    'lich-su': 'Lịch Sử',
    'kinh-di': 'Kinh Dị',
    'am-nhac': 'Âm Nhạc',
    'bi-an': 'Bí Ẩn',
    'tinh-cam': 'Tình Cảm',
    'vien-tuong': 'Viễn Tưởng',
    'gay-can': 'Gay Cấn',
    'chien-tranh': 'Chiến Tranh',
    'mien-tay': 'Miền Tây',
    'thieu-nhi': 'Thiếu Nhi',
    'thoi-su': 'Thời Sự',
    'truyen-hinh-thuc-te': 'Truyền Hình Thực Tế',
    'phim-dai': 'Phim Dài Tập',
    talkshow: 'Talkshow',
    // Catalog-only genres
    'tam-ly': 'Tâm Lý',
    'than-thoai': 'Thần Thoại',
    'co-trang': 'Cổ Trang',
    'vo-thuat': 'Võ Thuật',
    'tre-em': 'Trẻ Em',
    'hoc-duong': 'Học Đường',
    'the-thao': 'Thể Thao',
    'khoa-hoc': 'Khoa Học',
    'kinh-dien': 'Kinh Điển',
    'phim-ngan': 'Phim Ngắn',
  },
  en: {
    'hanh-dong': 'Action',
    'phieu-luu': 'Adventure',
    'hoat-hinh': 'Animation',
    'hai-huoc': 'Comedy',
    'hinh-su': 'Crime',
    'tai-lieu': 'Documentary',
    'chinh-kich': 'Drama',
    'gia-dinh': 'Family',
    'gia-tuong': 'Fantasy',
    'lich-su': 'History',
    'kinh-di': 'Horror',
    'am-nhac': 'Music',
    'bi-an': 'Mystery',
    'tinh-cam': 'Romance',
    'vien-tuong': 'Sci-Fi',
    'gay-can': 'Thriller',
    'chien-tranh': 'War',
    'mien-tay': 'Western',
    'thieu-nhi': 'Kids',
    'thoi-su': 'News',
    'truyen-hinh-thuc-te': 'Reality',
    'phim-dai': 'Soap',
    talkshow: 'Talk Show',
    // Catalog-only genres
    'tam-ly': 'Psychological',
    'than-thoai': 'Mythology',
    'co-trang': 'Period',
    'vo-thuat': 'Martial Arts',
    'tre-em': 'Kids',
    'hoc-duong': 'School',
    'the-thao': 'Sports',
    'khoa-hoc': 'Science',
    'kinh-dien': 'Classics',
    'phim-ngan': 'Shorts',
  },
};

// ============================================================================
// COUNTRIES
// ============================================================================
export const COUNTRY_MAP: Record<Locale, Record<string, string>> = {
  vi: {
    'viet-nam': 'Việt Nam',
    'hoa-ky': 'Hoa Kỳ',
    'han-quoc': 'Hàn Quốc',
    'trung-quoc': 'Trung Quốc',
    'nhat-ban': 'Nhật Bản',
    'thai-lan': 'Thái Lan',
    'dai-loan': 'Đài Loan',
    'hong-kong': 'Hồng Kông',
    'an-do': 'Ấn Độ',
    anh: 'Anh',
    phap: 'Pháp',
    duc: 'Đức',
    y: 'Ý',
    'tay-ban-nha': 'Tây Ban Nha',
    canada: 'Canada',
    uc: 'Úc',
    nga: 'Nga',
    'tho-nhi-ky': 'Thổ Nhĩ Kỳ',
    'ha-lan': 'Hà Lan',
    indonesia: 'Indonesia',
    philippines: 'Philippines',
    malaysia: 'Malaysia',
    singapore: 'Singapore',
    mexico: 'Mexico',
    brazil: 'Brazil',
    'ba-lan': 'Ba Lan',
    'thuy-dien': 'Thụy Điển',
    'dan-mach': 'Đan Mạch',
    'na-uy': 'Na Uy',
    'thuy-si': 'Thụy Sĩ',
    'bo-dao-nha': 'Bồ Đào Nha',
    'nam-phi': 'Nam Phi',
    ukraina: 'Ukraina',
    'a-rap-xe-ut': 'Ả Rập Xê Út',
    uae: 'UAE',
    argentina: 'Argentina',
    'au-my': 'Âu Mỹ',
    'chau-phi': 'Châu Phi',
    'quoc-gia-khac': 'Nước khác',
  },
  en: {
    'viet-nam': 'Vietnam',
    'hoa-ky': 'United States',
    'han-quoc': 'South Korea',
    'trung-quoc': 'China',
    'nhat-ban': 'Japan',
    'thai-lan': 'Thailand',
    'dai-loan': 'Taiwan',
    'hong-kong': 'Hong Kong',
    'an-do': 'India',
    anh: 'United Kingdom',
    phap: 'France',
    duc: 'Germany',
    y: 'Italy',
    'tay-ban-nha': 'Spain',
    canada: 'Canada',
    uc: 'Australia',
    nga: 'Russia',
    'tho-nhi-ky': 'Turkey',
    'ha-lan': 'Netherlands',
    indonesia: 'Indonesia',
    philippines: 'Philippines',
    malaysia: 'Malaysia',
    singapore: 'Singapore',
    mexico: 'Mexico',
    brazil: 'Brazil',
    'ba-lan': 'Poland',
    'thuy-dien': 'Sweden',
    'dan-mach': 'Denmark',
    'na-uy': 'Norway',
    'thuy-si': 'Switzerland',
    'bo-dao-nha': 'Portugal',
    'nam-phi': 'South Africa',
    ukraina: 'Ukraine',
    'a-rap-xe-ut': 'Saudi Arabia',
    uae: 'UAE',
    argentina: 'Argentina',
    'au-my': 'US & Europe',
    'chau-phi': 'Africa',
    'quoc-gia-khac': 'Elsewhere',
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
    'phim-chieu-rap': 'Chiếu rạp',
    'phim-thuyet-minh': 'Thuyết minh',
    'phim-long-tieng': 'Lồng tiếng',
  },
  en: {
    'phim-le': 'Movies',
    'phim-bo': 'TV Series',
    'hoat-hinh': 'Animation',
    'tv-shows': 'TV Shows',
    'phim-chieu-rap': 'Theatrical',
    'phim-thuyet-minh': 'Voiceover',
    'phim-long-tieng': 'Dubbed',
  },
};

// ============================================================================
// AUDIO / SUBTITLE LABELS
//
// The playback provider serves original audio with subtitles — there is no
// Vietnamese dub or voiceover in its catalog. `lang` is therefore always
// 'Phụ đề'. The older Vietsub / Thuyết Minh / Lồng Tiếng entries are kept so
// that watch-history records written before the migration still render a
// sensible chip instead of raw Vietnamese on the English site.
// ============================================================================
export const LANG_MAP: Record<Locale, Record<string, string>> = {
  vi: {
    'Phụ đề': 'Phụ đề',
    Vietsub: 'Vietsub',
    'Thuyết Minh': 'Thuyết Minh',
    'Lồng Tiếng': 'Lồng Tiếng',
    'Vietsub + Thuyết Minh': 'Vietsub + Thuyết Minh',
    'Vietsub + Lồng Tiếng': 'Vietsub + Lồng Tiếng',
  },
  en: {
    'Phụ đề': 'Subtitled',
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
//
// The adapter emits duration and episode-status strings in Vietnamese
// ("130 Phút", "45 phút/tập", "Hoàn tất (73/73)", "Tập 8") because Vietnamese
// is the site's primary locale. These turn them into English by deterministic
// replacement — no API call, no translation quota.
// ============================================================================

/**
 * Localize duration strings.
 *
 *   "45 phút/tập"        → "45 min/ep"
 *   "117 Phút"           → "117 mins"
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
 *   "Hoàn tất (10/10)"       → "Completed (10/10)"
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
 * Localize a season label produced by the adapter ("Phần 1" → "Season 1").
 */
export function localizedSeason(seasonName: string | undefined, locale: Locale): string {
  if (!seasonName) return '';
  if (locale === 'vi') return seasonName;
  return seasonName.replace(/^Phần\s+(\d+)$/i, 'Season $1');
}

/**
 * The title shown as the primary label on a card.
 *
 * The catalog names every title in Vietnamese and keeps the
 * original in `origin_name` — "Nhà Ngoại Giao (Phần 4)" / "The Diplomat
 * (Season 4)". So Vietnamese readers get `name`, everyone else gets the
 * original, which is English for most of the catalog and at least not a
 * language they didn't ask for for the rest.
 */
export function preferredTitle(
  name: string,
  origin_name: string | undefined,
  locale: Locale
): string {
  if (locale === 'vi') return name?.trim() || origin_name || '';
  return origin_name?.trim() || name || '';
}

/**
 * The "secondary" title shown beneath the primary one in CARD components
 * (newly / regular / continue-watching). Hero + detail pages have their own
 * subtitle logic — see those files.
 *
 * On `vi` it is the original title when it differs ("Ký Sinh Trùng" over
 * "Parasite"). On other locales the original is already the primary title,
 * and a Vietnamese line under it would be noise, so nothing is shown.
 */
export function secondaryTitle(
  name: string,
  origin_name: string | undefined,
  locale: Locale
): string {
  if (locale !== 'vi' || !origin_name) return '';
  return origin_name.trim() === name?.trim() ? '' : origin_name;
}
