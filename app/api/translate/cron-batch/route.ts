import { NextRequest, NextResponse } from 'next/server';
import { runCronBatch } from 'services/cron-translation-service';
import { routing } from 'i18n/routing';

/**
 * Translation cron endpoint — invoked by GitHub Actions on a schedule.
 *
 * Auth:
 *   Requires `Authorization: Bearer <CRON_SECRET>` header. Without this an
 *   anonymous attacker could spam the endpoint and burn your Groq quota.
 *
 * Query params:
 *   - `locale`  (default `en`)  — target locale; must be in `routing.locales`
 *                                  and not the default `vi`.
 *   - `pages`   (default `5`)   — number of OPhim pages to process this run.
 *                                  Capped at 20 to keep us under Vercel's 60s
 *                                  function timeout.
 *
 * Response:
 *   JSON `CronRunResult` with per-run stats (pages processed, cache hits,
 *   translations, errors). Useful for monitoring via curl / GitHub Actions log.
 *
 * Usage from CI:
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
 *     "$SITE_URL/api/translate/cron-batch?locale=en&pages=5"
 */

// Force dynamic rendering — never cache this endpoint
export const dynamic = 'force-dynamic';
// Allow up to 60s for batch processing (Vercel hobby max)
export const maxDuration = 60;

const DEFAULT_PAGES = 5;
const MAX_PAGES = 20;

export async function POST(req: NextRequest) {
  // ---- 1. Auth gate ----
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured on server' }, { status: 500 });
  }
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ---- 2. Parse + validate params ----
  const { searchParams } = new URL(req.url);
  const locale = (searchParams.get('locale') ?? 'en').toLowerCase();
  const pagesRaw = parseInt(searchParams.get('pages') ?? `${DEFAULT_PAGES}`, 10);
  const pages = Number.isFinite(pagesRaw)
    ? Math.max(1, Math.min(MAX_PAGES, pagesRaw))
    : DEFAULT_PAGES;

  if (!routing.locales.includes(locale as any)) {
    return NextResponse.json(
      { error: `Unsupported locale '${locale}'. Allowed: ${routing.locales.join(', ')}` },
      { status: 400 }
    );
  }
  if (locale === routing.defaultLocale) {
    return NextResponse.json(
      {
        error: `Locale '${locale}' is the default — nothing to translate. Use a non-default locale.`,
      },
      { status: 400 }
    );
  }

  // ---- 3. Run batch ----
  try {
    const result = await runCronBatch(locale, pages);
    return NextResponse.json(result, {
      status: result.status === 'failed' ? 500 : 200,
    });
  } catch (err: any) {
    console.error('[cron-batch] unexpected error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal error', status: 'failed' },
      { status: 500 }
    );
  }
}

// Allow GET for easy manual testing during dev (curl without -X POST).
// Remove this if stricter security is desired.
export const GET = POST;
