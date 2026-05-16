import { Redis } from '@upstash/redis';

/**
 * Singleton Upstash Redis client used as a low-cost cache layer in front of
 * external APIs (currently: TMDB images endpoint).
 *
 * Credentials come from `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`,
 * auto-injected by the Vercel ↔ Upstash marketplace integration (or set
 * manually in `.env.local` for local dev).
 *
 * Resolves to `null` when env vars are missing so callers can fall through to
 * direct upstream calls instead of crashing. Important for:
 *  - Local dev without Upstash configured
 *  - Misconfigured / new environments
 *  - Disaster scenarios where we want graceful degradation, not 500s
 */
const redis: Redis | null =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

export default redis;
