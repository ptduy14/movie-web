import redis from 'lib/upstash';
import type { MediaType } from 'constants/tmdb-taxonomy';
import { fetchIdList } from 'services/vidsrc-service';

/**
 * "Can vidsrc actually play this?"
 *
 * TMDB describes roughly a million titles; vidsrc can play about 95k films
 * and 20k series. Browsing TMDB without this filter would fill grids with
 * posters that open onto "This media is unavailable", so every list the user
 * sees is intersected with the ids vidsrc publishes daily at `/ids/*.txt`.
 *
 * The index lives in Redis as two plain sets of TMDB ids. Episode-level ids
 * (~508k of them) are deliberately NOT indexed: a missing episode inside a
 * series the user already opened is a far smaller problem than a dead link
 * in a grid, and it would quadruple the memory for the privilege.
 *
 * ## Fail-open
 *
 * Every read degrades to "available" when Redis is missing or erroring. A
 * site that shows a few unplayable titles is usable; a site that hides its
 * entire catalog because a cache is down is not. `isIndexReady()` lets
 * callers tell the two states apart when they care.
 */

const KEY = {
  movie: 'vs:ids:movie',
  tv: 'vs:ids:tv',
} as const;

/** Unix ms of the last successful sync, per media type. */
const SYNCED_AT_KEY = 'vs:ids:synced_at';

/** Staging key used while a fresh dump is being loaded (see `syncIdList`). */
const stagingKey = (type: MediaType) => `${KEY[type]}:staging`;

/**
 * Upstash caps the size of a single pipelined command. 5k ids per SADD keeps
 * each request comfortably under it while holding the 95k-id movie dump to
 * ~19 round trips.
 */
const SADD_CHUNK = 5000;

export interface AvailabilitySyncResult {
  type: MediaType;
  idsFetched: number;
  idsStored: number;
  durationMs: number;
}

/**
 * Whether the index has been populated at all.
 *
 * Returns false when Redis is unavailable OR when no sync has run yet — in
 * both cases callers should skip filtering rather than filter against an
 * empty set and render nothing.
 */
export async function isIndexReady(): Promise<boolean> {
  if (!redis) return false;
  try {
    const count = await redis.scard(KEY.movie);
    return typeof count === 'number' && count > 0;
  } catch {
    return false;
  }
}

/** When the index was last rebuilt, or null if never / unknown. */
export async function lastSyncedAt(): Promise<number | null> {
  if (!redis) return null;
  try {
    const value = await redis.get<number>(SYNCED_AT_KEY);
    return typeof value === 'number' ? value : null;
  } catch {
    return null;
  }
}

/** Single-title check. Fails open. */
export async function isAvailable(type: MediaType, id: string | number): Promise<boolean> {
  if (!redis) return true;
  try {
    return (await redis.sismember(KEY[type], String(id))) === 1;
  } catch {
    return true;
  }
}

/**
 * Batch membership for one media type, preserving input order.
 *
 * Uses SMISMEMBER so a 20-item page costs one round trip instead of twenty.
 * An empty input short-circuits; an empty index (nothing synced yet) reports
 * everything as available rather than blanking the page.
 */
export async function availabilityMap(
  type: MediaType,
  ids: (string | number)[]
): Promise<Map<string, boolean>> {
  const result = new Map<string, boolean>();
  if (ids.length === 0) return result;

  const keys = ids.map(String);
  if (!redis) {
    keys.forEach((id) => result.set(id, true));
    return result;
  }

  try {
    const flags = await redis.smismember(KEY[type], keys);
    // A set that has never been populated answers all-zero, which is
    // indistinguishable from "nothing is available" — treat it as not-ready.
    if (!Array.isArray(flags) || flags.every((f) => f === 0)) {
      const ready = await isIndexReady();
      if (!ready) {
        keys.forEach((id) => result.set(id, true));
        return result;
      }
    }
    keys.forEach((id, i) => result.set(id, flags[i] === 1));
  } catch {
    keys.forEach((id) => result.set(id, true));
  }
  return result;
}

/**
 * Keep only the items vidsrc can play.
 *
 * Works on anything carrying a TMDB id and media type, which in practice
 * means both raw TMDB rows and adapted view-model items. Groups by media
 * type so a mixed list (search results, the `hoat-hinh` format) costs two
 * round trips rather than one per item.
 */
export async function filterAvailable<T>(
  items: T[],
  select: (item: T) => { type: MediaType; id: string | number } | null
): Promise<T[]> {
  if (items.length === 0) return items;

  const byType: Record<MediaType, (string | number)[]> = { movie: [], tv: [] };
  const refs = items.map(select);
  for (const ref of refs) {
    if (ref) byType[ref.type].push(ref.id);
  }

  const [movieMap, tvMap] = await Promise.all([
    availabilityMap('movie', byType.movie),
    availabilityMap('tv', byType.tv),
  ]);

  return items.filter((_item, i) => {
    const ref = refs[i];
    // No resolvable id — keep it. Dropping rows for an internal reason the
    // user cannot see is worse than showing one that might not play.
    if (!ref) return true;
    const map = ref.type === 'tv' ? tvMap : movieMap;
    return map.get(String(ref.id)) !== false;
  });
}

// ============================================================================
// SYNC  (cron path — never call from a request handler)
// ============================================================================

/**
 * Rebuild one media type's index from vidsrc's daily dump.
 *
 * Loads into a staging key and RENAMEs it over the live key at the end, so
 * readers never observe a half-filled set — a partially loaded index would
 * silently hide most of the catalog for the duration of the load.
 */
export async function syncIdList(type: MediaType): Promise<AvailabilitySyncResult> {
  if (!redis) {
    throw new Error('Redis unavailable — cannot build the vidsrc availability index');
  }

  const started = Date.now();
  const ids = await fetchIdList(type === 'tv' ? 'tv_tmdb' : 'movie_tmdb');

  // The dumps contain blanks and the occasional "null" for titles vidsrc
  // holds under an IMDb id only; both would poison membership checks.
  const clean = ids.filter((id) => /^\d+$/.test(id));

  const staging = stagingKey(type);
  await redis.del(staging);

  let stored = 0;
  for (let i = 0; i < clean.length; i += SADD_CHUNK) {
    const chunk = clean.slice(i, i + SADD_CHUNK);
    // SADD's signature demands an explicit first member, so the spread has to
    // start from index 1 rather than spreading the whole chunk.
    await redis.sadd(staging, chunk[0], ...chunk.slice(1));
    stored += chunk.length;
  }

  if (stored === 0) {
    await redis.del(staging);
    throw new Error(`vidsrc ${type} dump produced no usable ids — refusing to publish an empty index`);
  }

  await redis.rename(staging, KEY[type]);
  await redis.set(SYNCED_AT_KEY, Date.now());

  return { type, idsFetched: ids.length, idsStored: stored, durationMs: Date.now() - started };
}
