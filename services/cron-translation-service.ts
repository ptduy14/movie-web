import 'server-only';
import { createHash } from 'crypto';
import { getCachedTranslation, saveCachedTranslation } from './firebase-translation-service';
import { translateMovieContentsBatch } from './groq-translation-service';
import { getCronProgress, saveCronProgress } from './cron-progress-service';
import { getLatest, getTitle, CatalogApiError } from './catalog-api';
import { enrichDetail } from './tmdb-enrichment';
import { adaptDetail } from 'lib/catalog-adapter';
import type { CronProgress, CronRunResult } from 'types/cron-meta';

/**
 * Pre-warms the synopsis cache for the English site.
 *
 * The catalog writes every synopsis in Vietnamese. On `en`, the detail page asks
 * TMDB first (`services/tmdb-enrichment`) and only falls back to a Groq
 * translation when TMDB has nothing — a title with no TMDB id and no
 * confident match, or a TMDB entry without an English overview. Those are
 * the titles this job translates ahead of time, so a visitor who opens one
 * doesn't wait on Groq mid-render.
 *
 * Direction: Vietnamese → English. `vi` needs nothing; it is the source.
 *
 * Walk: the catalog's "recently updated" feed, newest first, 24 titles a page.
 * Newest-first means fresh uploads get covered within the hour, and an
 * interrupted walk still leaves the most-visited end of the catalog done.
 *
 * Cost per page: one list request, then — only for titles without a TMDB
 * id (about a fifth) — one catalog detail plus the TMDB match. Titles with a
 * TMDB id are skipped without a detail request: TMDB serves their English
 * text at render time for free.
 */

/** `phim-moi-cap-nhat-v3` is fixed at 24 a page. */
const PAGE_SIZE = 24;
const TIMEOUT_BUFFER_MS = 50_000; // give up before Vercel hobby's 60s ceiling
const SOURCE_LANG = 'vi';

/**
 * The catalog is unreachable, or answered with something that isn't the JSON we
 * asked for.
 *
 * Split out from ordinary errors on purpose: an upstream that is down is not
 * a failure of this job. It makes the run report `skipped` (HTTP 200) instead
 * of `failed` (HTTP 500), so the scheduler doesn't go red over someone else's
 * outage — and it stops the batch immediately rather than retrying the next
 * page against the same dead host.
 */
export class UpstreamUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpstreamUnavailableError';
  }
}

/** Must match `hashSource` in `movie-content-localizer`, or cache hits never land. */
function hashSource(content: string): string {
  return createHash('sha1').update(content).digest('hex').slice(0, 16);
}

interface PageOutcome {
  itemsSeen: number;
  cacheHits: number;
  translated: number;
  failed: number;
  totalPages: number;
}

/**
 * Process one feed page: find the titles whose English synopsis would have
 * to come from Groq, and translate the ones not already cached in one call.
 *
 * "Would have to come from Groq" is decided by running the SAME path the
 * detail page runs — adapt, then enrich — so the job translates exactly the
 * text the page will look up, hashed the same way.
 */
async function processPage(page: number, locale: string): Promise<PageOutcome> {
  let feed;
  try {
    feed = await getLatest(page);
  } catch (err) {
    throw new UpstreamUnavailableError(
      err instanceof CatalogApiError ? `the catalog ${err.status} on ${err.path}` : 'Catalog API request failed'
    );
  }

  const totalPages = feed.totalPages;
  const itemsSeen = feed.items.length;
  const untracked = feed.items.filter((item) => !item.tmdb?.id);
  if (untracked.length === 0) {
    return { itemsSeen, cacheHits: itemsSeen, translated: 0, failed: 0, totalPages };
  }

  const probes = await Promise.all(
    untracked.map(async (item) => {
      try {
        const raw = await getTitle(item.slug);
        if (!raw) return null;
        const detail = await enrichDetail(adaptDetail(raw, { locale }), locale);
        // TMDB matched and supplied English — nothing for Groq to do.
        if (detail.movie.content_lang === locale || !detail.movie.content) return null;

        const id = detail.movie._id;
        const source = detail.movie.content;
        const sourceHash = hashSource(source);
        const cached = await getCachedTranslation(id, locale);
        return { id, source, sourceHash, isFresh: cached?.sourceHash === sourceHash };
      } catch {
        // One broken title must not sink the page.
        return null;
      }
    })
  );

  const needed = probes.filter((p): p is NonNullable<typeof p> => p !== null);
  const misses = needed.filter((p) => !p.isFresh);
  const cacheHits = itemsSeen - misses.length;

  if (misses.length === 0) {
    return { itemsSeen, cacheHits, translated: 0, failed: 0, totalPages };
  }

  let translatedMap: Map<string, string>;
  try {
    translatedMap = await translateMovieContentsBatch(
      misses.map((m) => ({ id: m.id, content: m.source })),
      locale,
      SOURCE_LANG
    );
  } catch (err: any) {
    console.warn(`[cron-translation] page ${page}: Groq batch failed:`, err.message);
    return { itemsSeen, cacheHits, translated: 0, failed: misses.length, totalPages };
  }

  let failed = 0;
  await Promise.all(
    misses.map((m) => {
      const content = translatedMap.get(m.id);
      if (!content) {
        failed += 1;
        return Promise.resolve();
      }
      return saveCachedTranslation(m.id, locale, {
        content,
        translatedAt: Date.now(),
        sourceHash: m.sourceHash,
        sourceLang: SOURCE_LANG,
      });
    })
  );

  return { itemsSeen, cacheHits, translated: misses.length - failed, failed, totalPages };
}

/**
 * Run a batch for a single locale.
 *
 *   1. Read the persisted cursor.
 *   2. Process `pageCount` pages from there, wrapping to 1 at the end of the
 *      feed.
 *   3. Checkpoint after every page, so a crash resumes rather than restarts.
 *   4. Stop early when close to the function timeout.
 */
export async function runCronBatch(locale: string, pageCount: number): Promise<CronRunResult> {
  const startedAt = Date.now();
  const progress: CronProgress = await getCronProgress(locale);

  const startPage = progress.lastPage + 1;
  let page = startPage;
  let pagesProcessed = 0;
  let itemsSeen = 0;
  let cacheHits = 0;
  let translated = 0;
  let failed = 0;
  let totalPages = progress.totalPages || 0;
  let status: CronProgress['lastRunStatus'] = 'success';
  let message: string | undefined;

  try {
    for (let i = 0; i < pageCount; i++) {
      if (Date.now() - startedAt > TIMEOUT_BUFFER_MS) {
        status = 'partial';
        message = 'stopped early to stay under the function timeout';
        break;
      }

      const outcome = await processPage(page, locale);

      pagesProcessed += 1;
      itemsSeen += outcome.itemsSeen;
      cacheHits += outcome.cacheHits;
      translated += outcome.translated;
      failed += outcome.failed;
      if (outcome.totalPages) totalPages = outcome.totalPages;

      // Checkpoint before advancing, so an interrupted run resumes on the
      // page after the last one that actually completed.
      await saveCronProgress(locale, {
        ...progress,
        lastPage: page,
        totalPages,
        totalItems: totalPages * PAGE_SIZE,
        totalProcessed: progress.totalProcessed + itemsSeen,
        totalTranslated: progress.totalTranslated + translated,
        totalSkippedCache: progress.totalSkippedCache + cacheHits,
        lastRunAt: Date.now(),
        lastRunStatus: status,
        lastError: null,
      });

      page = page + 1 > (totalPages || Infinity) ? 1 : page + 1;
    }
  } catch (err: any) {
    if (err instanceof UpstreamUnavailableError) {
      status = 'skipped';
      message = err.message;
    } else {
      status = 'failed';
      message = err?.message ?? 'unknown error';
      await saveCronProgress(locale, {
        ...progress,
        lastPage: Math.max(startPage - 1, progress.lastPage),
        lastRunAt: Date.now(),
        lastRunStatus: 'failed',
        lastError: message ?? null,
      });
    }
  }

  return {
    locale,
    startPage,
    endPage: Math.max(page - 1, startPage - 1),
    pagesProcessed,
    itemsSeen,
    cacheHits,
    translated,
    failed,
    durationMs: Date.now() - startedAt,
    status,
    message,
  };
}
