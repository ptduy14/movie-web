import 'server-only';
import { createHash } from 'crypto';
import { getCachedTranslation, saveCachedTranslation } from './firebase-translation-service';
import { translateMovieContentsBatch } from './groq-translation-service';
import { getCronProgress, saveCronProgress } from './cron-progress-service';
import { discover, TmdbError } from './tmdb-catalog-service';
import { availabilityMap } from './vidsrc-availability';
import { mediaId } from 'lib/media-key';
import type { MediaType } from 'constants/tmdb-taxonomy';
import type { CronProgress, CronRunResult } from 'types/cron-meta';
import type { TmdbListItem } from 'types/tmdb-api';

/**
 * Pre-warms the Vietnamese synopsis cache.
 *
 * TMDB translates the popular end of its catalog itself; the long tail comes
 * back with an empty `overview` for vi-VN. Those are the titles this job
 * translates ahead of time, so a visitor who lands on one doesn't wait on a
 * Groq round trip mid-render.
 *
 * Direction note: under the previous catalog this ran Vietnamese → English.
 * TMDB supplies English, so it now runs English → Vietnamese and the DEFAULT
 * locale is the one that needs filling in. `vi` is the only meaningful target
 * today; `en` needs nothing.
 *
 * Walk strategy: TMDB discover, ordered by popularity, movies and series
 * alternating page by page. Popularity order matters — it means the titles
 * most likely to be opened get a synopsis first, and an interrupted walk
 * still leaves the catalog better off than it found it.
 */

/** TMDB pages hold 20 results. */
const PAGE_SIZE = 20;
const TIMEOUT_BUFFER_MS = 50_000; // give up before Vercel hobby's 60s ceiling

/**
 * TMDB is unreachable, or answered with something that isn't the JSON we
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

function hashSource(content: string): string {
  return createHash('sha1').update(content).digest('hex').slice(0, 16);
}

/** Alternate media types across pages so neither starves the other. */
function mediaTypeForPage(page: number): MediaType {
  return page % 2 === 1 ? 'movie' : 'tv';
}

/** TMDB page number for our page cursor, given the alternating walk. */
function tmdbPageForPage(page: number): number {
  return Math.floor((page - 1) / 2) + 1;
}

interface PageOutcome {
  itemsSeen: number;
  cacheHits: number;
  translated: number;
  failed: number;
  totalPages: number;
}

/**
 * Process one cursor page: fetch the same TMDB page in both languages, find
 * the titles with no Vietnamese synopsis, translate them in one Groq call.
 *
 * Two discover calls per page (vi-VN and en-US) is what makes this cheap. The
 * alternative — asking TMDB per title whether a Vietnamese overview exists —
 * would be one request per item instead of two per twenty.
 */
async function processPage(page: number, locale: string): Promise<PageOutcome> {
  const mediaType = mediaTypeForPage(page);
  const tmdbPage = tmdbPageForPage(page);

  let localized: { results: TmdbListItem[]; total_pages: number };
  let english: { results: TmdbListItem[]; total_pages: number };
  try {
    [localized, english] = await Promise.all([
      discover({ mediaType, locale, page: tmdbPage }),
      discover({ mediaType, locale: 'en', page: tmdbPage }),
    ]);
  } catch (err) {
    throw new UpstreamUnavailableError(
      err instanceof TmdbError ? `TMDB ${err.status} on ${err.path}` : 'TMDB request failed'
    );
  }

  const englishById = new Map(english.results.map((r) => [r.id, r]));
  const totalPages = localized.total_pages * 2; // two cursor pages per TMDB page

  if (localized.results.length === 0) {
    return { itemsSeen: 0, cacheHits: 0, translated: 0, failed: 0, totalPages };
  }

  // Only spend quota on titles that can actually be played. Translating a
  // synopsis nobody can reach is pure cost.
  const playable = await availabilityMap(
    mediaType,
    localized.results.map((r) => r.id)
  );

  const candidates = localized.results.filter((item) => {
    if (playable.get(String(item.id)) === false) return false;
    // A non-empty localized overview means TMDB already has it — nothing to do.
    if (item.overview) return false;
    return Boolean(englishById.get(item.id)?.overview);
  });

  const itemsSeen = localized.results.length;
  if (candidates.length === 0) {
    return { itemsSeen, cacheHits: itemsSeen, translated: 0, failed: 0, totalPages };
  }

  const probes = await Promise.all(
    candidates.map(async (item) => {
      const id = mediaId(mediaType, item.id);
      const source = englishById.get(item.id)!.overview!;
      const sourceHash = hashSource(source);
      const cached = await getCachedTranslation(id, locale);
      return { id, source, sourceHash, isFresh: cached?.sourceHash === sourceHash };
    })
  );

  const misses = probes.filter((p) => !p.isFresh);
  const cacheHits = itemsSeen - misses.length;

  if (misses.length === 0) {
    return { itemsSeen, cacheHits, translated: 0, failed: 0, totalPages };
  }

  let translatedMap: Map<string, string>;
  try {
    translatedMap = await translateMovieContentsBatch(
      misses.map((m) => ({ id: m.id, content: m.source })),
      locale,
      'en'
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
        sourceLang: 'en',
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
 *      catalog.
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

      // TMDB caps discover at 500 pages regardless of total_pages, so the
      // walk wraps well before the catalog "ends".
      page = page + 1 > Math.min(totalPages || Infinity, 1000) ? 1 : page + 1;
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
