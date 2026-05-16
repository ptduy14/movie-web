import redis from 'lib/upstash';
import type { TmdbLogo } from 'types/tmdb-logo';

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days — artwork changes rarely

/**
 * Read result: either the cached array (locale-agnostic) or `undefined` for
 * "no cache entry / cache unavailable".
 *
 * We DON'T use `null` here because an empty array `[]` is a meaningful cached
 * value ("TMDB returned this title but it has no items") — distinct from
 * "we don't know yet, go ask TMDB".
 */
type CacheReadResult = TmdbLogo[] | undefined;

const buildLogoKey   = (type: string, id: string) => `tmdb:images:${type}:${id}`;
const buildPosterKey = (type: string, id: string) => `tmdb:posters:${type}:${id}`;

async function getCached(key: string): Promise<CacheReadResult> {
  if (!redis) return undefined;
  try {
    const cached = await redis.get<TmdbLogo[]>(key);
    return cached ?? undefined;
  } catch {
    return undefined;
  }
}

async function setCached(key: string, items: TmdbLogo[]): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, items, { ex: CACHE_TTL_SECONDS });
  } catch {
    // Cache write failure is non-fatal.
  }
}

export async function getCachedLogos(type: string, id: string): Promise<CacheReadResult> {
  return getCached(buildLogoKey(type, id));
}

export async function setCachedLogos(type: string, id: string, logos: TmdbLogo[]): Promise<void> {
  return setCached(buildLogoKey(type, id), logos);
}

export async function getCachedPosters(type: string, id: string): Promise<CacheReadResult> {
  return getCached(buildPosterKey(type, id));
}

export async function setCachedPosters(type: string, id: string, posters: TmdbLogo[]): Promise<void> {
  return setCached(buildPosterKey(type, id), posters);
}
