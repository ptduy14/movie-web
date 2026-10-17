import { CATEGORY_MAP, COUNTRY_MAP } from 'constants/i18n-mappings';
import { isBrowsableGenre } from 'constants/catalog-taxonomy';
import { buildEmbedUrl } from 'services/vidsrc-service';
import type {
  ApiDetailResponse,
  ApiListItem,
  ApiPeoplesResponse,
  ApiImagesResponse,
  ApiServer,
  ApiTaxonomyRef,
} from 'types/catalog-api';
import type NewlyMovie from 'types/newly-movie';
import type Movie from 'types/movie';
import type DetailMovie from 'types/detail-movie';
import type Episode from 'types/episode';
import type Category from 'types/category';
import type Country from 'types/country';
import type Tmdb from 'types/tmdb';
import type Imdb from 'types/imdb';
import type Actor from 'types/actor';
import type MovieImage from 'types/movie-image';

/**
 * The catalog → the app's view model.
 *
 * The catalog descends from the original API the view model was first written
 * against, so most fields map one-to-one. The exceptions are what this file
 * is for:
 *
 *  - **Image orientation is swapped.** the catalog's `thumb_url` is the LANDSCAPE
 *    still and `poster_url` the PORTRAIT poster; the app uses `thumb_url`
 *    for the portrait card and `poster_url` for the landscape hero.
 *  - **Image paths are mixed.** List rows carry relative paths
 *    (`uploads/movies/…webp`, `upload/vod/…jpg`), detail rows absolute ones.
 *  - **`content` is HTML.** The summary component renders text, so markup is
 *    flattened here rather than injected there.
 *  - **Category chips leak TMDB's English genres** (`war-politics`), which
 *    the site has no page for. They are dropped.
 *  - **`episodes[]` is servers again** (Vietsub / Thuyết Minh / Lồng Tiếng),
 *    as it was before the vidsrc era. Seasons are separate titles upstream.
 *
 * Absent data stays absent. Rating badges, trailers and the quality chip all
 * hide themselves on empty values, which is the honest rendering of "the
 * catalog doesn't know".
 */

/** Where list rows' relative image paths resolve when the response doesn't say. */
const DEFAULT_IMAGE_CDN = 'https://phimimg.com';

// ============================================================================
// SMALL HELPERS
// ============================================================================

/** Absolute image URL from a catalog path, or `''` when there is none. */
export function catalogImageUrl(path: string | null | undefined, cdn: string = DEFAULT_IMAGE_CDN): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${cdn.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/**
 * Flatten the catalog's HTML synopsis to plain text.
 *
 * Paragraph and line breaks become newlines so a multi-paragraph synopsis
 * keeps its shape; every other tag is dropped. Entities are decoded because
 * the text is rendered via `textContent`, where `&amp;` would show literally.
 */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*p\s*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
      if (entity[0] === '#') {
        const code =
          entity[1] === 'x' || entity[1] === 'X'
            ? parseInt(entity.slice(2), 16)
            : parseInt(entity.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      }
      return HTML_ENTITIES[entity.toLowerCase()] ?? match;
    })
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function toCategories(refs: ApiTaxonomyRef[] | undefined, locale: string): Category[] {
  const seen = new Set<string>();
  const out: Category[] = [];
  for (const ref of refs ?? []) {
    if (!isBrowsableGenre(ref.slug) || seen.has(ref.slug)) continue;
    seen.add(ref.slug);
    out.push({
      id: ref.id,
      // Render sites localize via `localizedCategory(slug, locale)`; this is
      // the readable fallback, not the rendered string.
      name: CATEGORY_MAP[locale as 'vi' | 'en']?.[ref.slug] ?? ref.name,
      slug: ref.slug,
    });
  }
  return out;
}

function toCountries(refs: ApiTaxonomyRef[] | undefined, locale: string): Country[] {
  const seen = new Set<string>();
  const out: Country[] = [];
  for (const ref of refs ?? []) {
    if (!ref.slug || seen.has(ref.slug)) continue;
    seen.add(ref.slug);
    out.push({
      id: ref.id,
      name: COUNTRY_MAP[locale as 'vi' | 'en']?.[ref.slug] ?? ref.name,
      slug: ref.slug,
    });
  }
  return out;
}

function toTmdb(item: ApiListItem): Tmdb {
  const ref = item.tmdb;
  return {
    id: ref?.id ? String(ref.id) : null,
    type: ref?.type ?? null,
    season: ref?.season ?? null,
    vote_average: ref?.vote_average ?? 0,
    vote_count: ref?.vote_count ?? 0,
  };
}

function toImdb(item: ApiListItem): Imdb | undefined {
  const ref = item.imdb;
  if (!ref?.id) return undefined;
  return { id: ref.id, vote_average: ref.vote_average ?? 0, vote_count: ref.vote_count ?? 0 };
}

/** the catalog stamps "Đang cập nhật" ("being updated") where it has no name. */
function realNames(names: string[] | undefined): string[] {
  return (names ?? []).map((n) => n.trim()).filter((n) => n && !/^đang cập nhật$/i.test(n));
}

function toNumber(value: number | string | null | undefined): number | undefined {
  const n = typeof value === 'string' ? parseInt(value, 10) : value;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : undefined;
}

// ============================================================================
// LIST ITEMS
// ============================================================================

export interface AdaptOptions {
  locale: string;
  /** Base for relative image paths — `ApiPage.imageCdn`. */
  imageCdn?: string;
}

/** One the catalog list row → `NewlyMovie`. */
export function adaptListItem(item: ApiListItem, opts: AdaptOptions): NewlyMovie {
  const cdn = opts.imageCdn ?? DEFAULT_IMAGE_CDN;
  const portrait = catalogImageUrl(item.poster_url, cdn);
  const landscape = catalogImageUrl(item.thumb_url, cdn);

  return {
    _id: item._id,
    name: item.name,
    slug: item.slug,
    origin_name: item.origin_name || item.name,
    // Swapped on purpose — see the file header.
    thumb_url: portrait || landscape,
    poster_url: landscape || portrait,
    year: item.year ?? 0,
    tmdb: toTmdb(item),
    imdb: toImdb(item),
    modified: item.modified?.time ? { time: item.modified.time } : undefined,
    alternative_names: item.alternative_names,
    type: item.type,
    sub_docquyen: item.sub_docquyen ?? false,
    chieurap: item.chieurap ?? false,
    time: item.time || undefined,
    episode_current: item.episode_current || undefined,
    quality: item.quality || undefined,
    lang: item.lang || undefined,
    lang_key: item.lang_key,
    category: toCategories(item.category, opts.locale),
    country: toCountries(item.country, opts.locale),
  };
}

export function adaptListItems(items: ApiListItem[], opts: AdaptOptions): NewlyMovie[] {
  return items.filter((item) => item?._id && item.slug).map((item) => adaptListItem(item, opts));
}

// ============================================================================
// DETAIL
// ============================================================================

/** "tap-01" → 1, "full" → undefined. */
function episodeNumber(slug: string): number | undefined {
  const match = /(\d+)/.exec(slug);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * The catalog servers → `Episode[]`.
 *
 * Each server is one audio track (Vietsub / Thuyết Minh / Lồng Tiếng) with
 * its own copy of every episode. `link_m3u8` is the playable address.
 * `link_embed` is NOT the catalog's own embed (ads, tracking, no events to hook
 * progress on): it is the vidsrc fallback for the same episode, built from
 * the TMDB reference, or `''` when the title has none.
 *
 * Servers with no episodes are dropped; a "trailer" title upstream has one
 * server with an empty `server_data`, and an empty selector is worse than
 * none.
 */
export function buildServers(
  servers: ApiServer[] | undefined,
  tmdb: Tmdb,
  imdbId: string | null
): Episode[] {
  const isTv = tmdb.type === 'tv';
  return (servers ?? [])
    .map((server) => ({
      server_name: server.server_name?.trim() || 'Vietsub',
      server_data: (server.server_data ?? [])
        .filter((ep) => ep.link_m3u8 || ep.link_embed)
        .map((ep) => {
          const number = episodeNumber(ep.slug);
          return {
            name: ep.name,
            slug: ep.slug,
            filename: ep.filename,
            link_m3u8: ep.link_m3u8 ?? '',
            link_embed:
              tmdb.id || imdbId
                ? buildEmbedUrl({
                    type: isTv ? 'tv' : 'movie',
                    tmdbId: tmdb.id ?? undefined,
                    imdbId,
                    season: isTv ? tmdb.season ?? 1 : undefined,
                    episode: isTv ? number ?? 1 : undefined,
                  })
                : '',
          };
        }),
    }))
    .filter((server) => server.server_data.length > 0);
}

/**
 * Rebuild every episode's backup (vidsrc) address from a TMDB reference.
 *
 * Used after `services/tmdb-enrichment` matches a title the catalog had no TMDB
 * id for: the adapter left `link_embed` empty then, and now there is
 * something to point it at. Episodes that already have one are rewritten
 * too, so a corrected id wins.
 */
export function withBackupLinks(episodes: Episode[], tmdb: Tmdb, imdbId: string | null): Episode[] {
  if (!tmdb.id && !imdbId) return episodes;
  const isTv = tmdb.type === 'tv';
  return episodes.map((server) => ({
    ...server,
    server_data: server.server_data.map((ep) => ({
      ...ep,
      link_embed: buildEmbedUrl({
        type: isTv ? 'tv' : 'movie',
        tmdbId: tmdb.id ?? undefined,
        imdbId,
        season: isTv ? tmdb.season ?? 1 : undefined,
        episode: isTv ? episodeNumber(ep.slug) ?? 1 : undefined,
      }),
    })),
  }));
}

/** Full the catalog detail → `DetailMovie` (the shape the detail and watch pages take). */
export function adaptDetail(detail: ApiDetailResponse, opts: AdaptOptions): DetailMovie {
  const source = detail.movie;
  const base = adaptListItem(source, opts);
  const imdbId = base.imdb?.id ?? null;

  const movie: Movie = {
    ...base,
    poster_url: base.poster_url || base.thumb_url,
    type: base.type ?? 'single',
    sub_docquyen: base.sub_docquyen ?? false,
    chieurap: base.chieurap ?? false,
    time: base.time ?? '',
    episode_current: base.episode_current ?? '',
    lang: base.lang ?? '',
    category: base.category ?? [],
    country: base.country ?? [],
    actor: realNames(source.actor),
    director: realNames(source.director),
    content: htmlToText(source.content),
    // The catalog writes every synopsis in Vietnamese. The localizer compares
    // this against the active locale to decide whether `en` needs a
    // translation (or a TMDB English overview).
    content_lang: 'vi',
    trailer_url: source.trailer_url || '',
    status: source.status,
    episode_total: toNumber(source.episode_total),
  };

  return { movie, episodes: buildServers(detail.episodes, base.tmdb, imdbId) };
}

// ============================================================================
// TMDB-MIRRORED EXTRAS
// ============================================================================

/**
 * `/peoples` → the `Actor` shape `ActorList` already renders.
 *
 * Acting credits only, in the catalog's order (which follows TMDB billing).
 * Fields the endpoint doesn't carry are zeroed; nothing reads them.
 */
export function adaptPeoples(peoples: ApiPeoplesResponse['data']['peoples'], limit = 20): Actor[] {
  return peoples
    .filter((p) => p.known_for_department === 'Acting' || p.character)
    .slice(0, limit)
    .map((p, order) => ({
      adult: false,
      gender: p.gender,
      id: p.tmdb_people_id,
      known_for_department: p.known_for_department,
      name: p.name,
      original_name: p.original_name,
      popularity: 0,
      profile_path: p.profile_path || null,
      cast_id: 0,
      character: p.character,
      credit_id: '',
      order,
    }));
}

/** `/images` → `MovieImage[]` (TMDB file paths, rendered via `lib/tmdb-image`). */
export function adaptImages(images: ApiImagesResponse['data']['images']): MovieImage[] {
  return images.map((img) => ({
    width: img.width,
    height: img.height,
    aspect_ratio: img.aspect_ratio,
    type: img.type,
    file_path: img.file_path,
    iso_639_1: img.iso_639_1 ?? '',
  }));
}
