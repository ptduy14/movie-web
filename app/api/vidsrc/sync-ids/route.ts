import { NextRequest, NextResponse } from 'next/server';
import { syncIdList, lastSyncedAt } from 'services/vidsrc-availability';
import type { MediaType } from 'constants/tmdb-taxonomy';

/**
 * Rebuilds the vidsrc availability index from the provider's daily ID dumps.
 * Invoked by GitHub Actions (`.github/workflows/vidsrc-ids-cron.yml`).
 *
 * Auth:
 *   `Authorization: Bearer <CRON_SECRET>`. Without it anyone could force
 *   repeated 95k-id loads and exhaust the Redis command quota.
 *
 * Query params:
 *   - `type` — `movie` | `tv` | `all` (default `all`).
 *
 * Deliberately NOT maintenance-gated, unlike the translation cron. Keeping
 * the index warm while the site is dark is exactly what makes the first
 * request after MAINTENANCE_MODE is lifted return a full catalog instead of
 * an unfiltered one.
 *
 * Usage:
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
 *     "$SITE_URL/api/vidsrc/sync-ids?type=all"
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const VALID_TYPES: MediaType[] = ['movie', 'tv'];

export async function POST(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured on server' }, { status: 500 });
  }
  if (req.headers.get('authorization') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const requested = (searchParams.get('type') ?? 'all').toLowerCase();
  if (requested !== 'all' && !VALID_TYPES.includes(requested as MediaType)) {
    return NextResponse.json(
      { error: `Invalid type '${requested}'. Allowed: movie, tv, all` },
      { status: 400 }
    );
  }

  const types: MediaType[] = requested === 'all' ? VALID_TYPES : [requested as MediaType];

  try {
    // Sequential, not parallel: each type streams a multi-megabyte dump and
    // then issues ~20 SADD round trips. Running both at once risks the 60s
    // function ceiling for no real gain.
    const results = [];
    for (const type of types) {
      results.push(await syncIdList(type));
    }

    return NextResponse.json({
      status: 'success',
      results,
      syncedAt: await lastSyncedAt(),
    });
  } catch (err: any) {
    console.error('[vidsrc/sync-ids] failed:', err);
    return NextResponse.json(
      { status: 'failed', error: err?.message ?? 'Internal error' },
      { status: 500 }
    );
  }
}

// GET mirrors POST so the endpoint can be smoke-tested with a plain curl.
export const GET = POST;
