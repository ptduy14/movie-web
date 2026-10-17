import { Redis } from '@upstash/redis';

/**
 * Singleton Upstash Redis client, used as a low-cost cache in front of TMDB
 * image lookups (title logos). Optional: everything works without it, only
 * slower.
 *
 * Credential env vars come in two flavours depending on how the store was
 * attached:
 *   - `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — the Upstash
 *     marketplace integration.
 *   - `KV_REST_API_URL` / `KV_REST_API_TOKEN` — Vercel KV, which is Upstash
 *     underneath and speaks the same REST protocol.
 *
 * We accept BOTH. Reading only the first pair is how this silently resolved
 * to `null` in an environment provisioned through Vercel KV: every cache read
 * missed, every write was dropped, and nothing logged because the null case
 * is a legitimate degraded mode.
 *
 * Still resolves to `null` when neither pair is present, so callers fall
 * through to direct upstream calls instead of crashing. Important for:
 *  - Local dev without a Redis configured
 *  - Misconfigured / new environments
 *  - Disaster scenarios where we want graceful degradation, not 500s
 */
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

/**
 * No retries. Redis is only a cache here, so an unreachable instance should
 * cost one failed request, not the client's default retry ladder — with a
 * dead host (DNS ENOTFOUND) that ladder took ~9.5 s per lookup and stalled
 * the home hero behind it.
 */
const redis: Redis | null = url && token ? new Redis({ url, token, retry: { retries: 0 } }) : null;

if (!redis && process.env.NODE_ENV !== 'production') {
  console.warn(
    '[upstash] no Redis credentials found (checked UPSTASH_REDIS_REST_* and KV_REST_API_*) — TMDB logo caching is disabled'
  );
}

export default redis;
