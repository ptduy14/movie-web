import redis from 'lib/upstash';
import type { TmdbLogo } from 'types/tmdb-logo';

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days — logos change rarely

/**
 * Read result: either the cached logos array (locale-agnostic — picker filters
 * per-request so picker logic changes apply without flushing cache) or
 * `undefined` for "no cache entry / cache unavailable".
 *
 * We DON'T use `null` here because an empty array `[]` is a meaningful cached
 * value ("TMDB returned this title but it has no logos") — distinct from
 * "we don't know yet, go ask TMDB".
 */
type CacheReadResult = TmdbLogo[] | undefined;

const buildKey = (type: string, id: string): string => `tmdb:images:${type}:${id}`;

/**
 * Look up cached logos for a TMDB title. Returns `undefined` on cache miss
 * OR on any infrastructure failure — caller treats both as "fetch fresh".
 *
 * Never throws. Upstash latency timeouts / network errors are swallowed so
 * a flaky cache never breaks the page; worst case we degrade to direct TMDB.
 */
export async function getCachedLogos(type: string, id: string): Promise<CacheReadResult> {
  if (!redis) return undefined;
  try {
    // @upstash/redis auto-deserializes JSON-encoded values, so the generic
    // type parameter gives us a typed array directly without manual parsing.
    const cached = await redis.get<TmdbLogo[]>(buildKey(type, id));
    return cached ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Write logos array to cache with a 7-day TTL. Empty arrays are stored as-is
 * so future requests for "this title has no logos" hit the cache instead of
 * spending a TMDB call.
 *
 * Fire-and-forget semantics: cache write failures are swallowed since the
 * caller already has the data — we just lose the speed-up next request.
 */
export async function setCachedLogos(type: string, id: string, logos: TmdbLogo[]): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(buildKey(type, id), logos, { ex: CACHE_TTL_SECONDS });
  } catch {
    // Cache write failure is non-fatal.
  }
}
