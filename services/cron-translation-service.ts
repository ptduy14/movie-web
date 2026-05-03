import 'server-only';
import MovieServices from './movie-services';
import { getCachedTranslation, saveCachedTranslation } from './firebase-translation-service';
import { translateMovieContentsBatch } from './groq-translation-service';
import { getCronProgress, saveCronProgress } from './cron-progress-service';
import type { CronProgress, CronRunResult } from 'types/cron-meta';

const PAGE_SIZE = 24; // matches OPhim default for /v1/api/danh-sach/phim-moi
const TIMEOUT_BUFFER_MS = 50_000; // give up before Vercel hobby's 60s ceiling

interface OPhimListItem {
  _id: string;
  slug: string;
  modified?: { time: string };
}

interface OPhimDetailItem {
  movie?: {
    _id: string;
    content?: string;
    modified?: { time: string };
  };
}

/**
 * Run a translation cron batch for a single locale.
 *
 * High-level algorithm:
 *   1. Read persisted progress (`lastPage`, totals, etc.).
 *   2. Determine page window to process [lastPage+1 ... lastPage+pageCount],
 *      wrapping back to 1 when the catalog ends.
 *   3. For each page:
 *      a. Fetch list from OPhim → 24 items with `_id`, `slug`, `modified.time`.
 *      b. Cache lookup in parallel; identify which movies are missing or stale.
 *      c. For misses: fetch the detail endpoint to get `content` (parallel).
 *      d. Send all misses' contents in ONE batched Groq call.
 *      e. Save translations to Firestore (parallel writes).
 *      f. Persist progress so a crash leaves us at a safe checkpoint.
 *   4. Stop early if approaching the 60s Vercel timeout.
 *   5. Return a structured summary for monitoring.
 *
 * Cost behaviour:
 *   - Cache-aware: pages where every movie is already translated cost 0
 *     Groq calls (only Firestore reads).
 *   - One Groq call per page max, regardless of how many movies are missing
 *     (1..24).
 *   - OPhim list + detail fetches are unbounded but free.
 */
export async function runCronBatch(locale: string, pageCount: number): Promise<CronRunResult> {
  const startTime = Date.now();

  if (locale === 'vi') {
    return {
      locale,
      startPage: 0,
      endPage: 0,
      pagesProcessed: 0,
      itemsSeen: 0,
      cacheHits: 0,
      translated: 0,
      failed: 0,
      durationMs: 0,
      status: 'success',
      message: 'Skipped: vi is the source language, nothing to translate.',
    };
  }

  const progress = await getCronProgress(locale);

  // Determine starting page. Wrap to 1 when we've cycled past the end so the
  // cron keeps catching newly-added or recently-modified movies.
  let nextPage =
    progress.totalPages > 0 && progress.lastPage >= progress.totalPages ? 1 : progress.lastPage + 1;
  const startPage = nextPage;

  let pagesProcessed = 0;
  let itemsSeen = 0;
  let cacheHits = 0;
  let translated = 0;
  let failed = 0;
  let lastError: string | null = null;
  let totalPages = progress.totalPages;
  let totalItems = progress.totalItems;

  for (let i = 0; i < pageCount; i++) {
    if (Date.now() - startTime > TIMEOUT_BUFFER_MS) {
      lastError = 'Stopped early to avoid Vercel timeout';
      break;
    }

    try {
      const pageResult = await processPage(locale, nextPage);
      itemsSeen += pageResult.itemsSeen;
      cacheHits += pageResult.cacheHits;
      translated += pageResult.translated;
      failed += pageResult.failed;

      if (pageResult.totalItems > 0) {
        totalItems = pageResult.totalItems;
        totalPages = Math.ceil(totalItems / PAGE_SIZE);
      }

      // Successful page → advance pointer + persist immediately
      const advancedPage = nextPage;
      nextPage = advancedPage + 1;
      pagesProcessed += 1;

      const updated: CronProgress = {
        ...progress,
        lastPage: advancedPage >= totalPages && totalPages > 0 ? totalPages : advancedPage,
        totalPages,
        totalItems,
        totalProcessed: progress.totalProcessed + pageResult.itemsSeen,
        totalTranslated: progress.totalTranslated + pageResult.translated,
        totalSkippedCache: progress.totalSkippedCache + pageResult.cacheHits,
        lastRunAt: Date.now(),
        lastRunStatus: 'success',
        lastError: null,
      };
      // Mutate progress so subsequent iterations see the new lifetime totals
      progress.totalProcessed = updated.totalProcessed;
      progress.totalTranslated = updated.totalTranslated;
      progress.totalSkippedCache = updated.totalSkippedCache;
      progress.lastPage = updated.lastPage;
      progress.totalPages = updated.totalPages;
      progress.totalItems = updated.totalItems;
      await saveCronProgress(locale, updated);

      // Wrap to page 1 if we hit the end
      if (totalPages > 0 && nextPage > totalPages) {
        nextPage = 1;
      }
    } catch (err: any) {
      lastError = err.message ?? String(err);
      console.warn(`[cron-translation-service] page ${nextPage} failed:`, lastError);
      failed += 1;
      break;
    }
  }

  // Final progress write capturing terminal status
  const status: CronProgress['lastRunStatus'] = lastError
    ? pagesProcessed > 0
      ? 'partial'
      : 'failed'
    : 'success';

  await saveCronProgress(locale, {
    ...progress,
    lastRunAt: Date.now(),
    lastRunStatus: status,
    lastError,
  });

  return {
    locale,
    startPage,
    endPage: nextPage - 1 < startPage ? startPage : nextPage - 1,
    pagesProcessed,
    itemsSeen,
    cacheHits,
    translated,
    failed,
    durationMs: Date.now() - startTime,
    status,
    message: lastError ?? undefined,
  };
}

interface PageResult {
  itemsSeen: number;
  cacheHits: number;
  translated: number;
  failed: number;
  totalItems: number; // from pagination — propagates to global totals
}

/**
 * Process exactly one OPhim list page for the target locale.
 *
 * Steps:
 *   1. Fetch the list page (24 items, no `content`).
 *   2. Probe Firestore cache for each item in parallel.
 *   3. For cache misses: fetch detail endpoint in parallel to get `content`.
 *   4. Batched Groq call for all (movieId, content) pairs that need work.
 *   5. Persist each translated item to Firestore (parallel best-effort).
 */
async function processPage(locale: string, page: number): Promise<PageResult> {
  const list = await MovieServices.getNewMovies(page, PAGE_SIZE);
  if (list?.status !== 'success') {
    throw new Error(`OPhim list page ${page} returned non-success status`);
  }

  const items: OPhimListItem[] = list?.data?.items ?? [];
  const totalItems: number = list?.data?.params?.pagination?.totalItems ?? 0;

  if (items.length === 0) {
    return { itemsSeen: 0, cacheHits: 0, translated: 0, failed: 0, totalItems };
  }

  // 1. Cache probe — find cache hits vs misses
  const cacheChecks = await Promise.all(
    items.map(async (it) => {
      const cached = await getCachedTranslation(it._id, locale);
      const sourceModifiedAt = it.modified?.time ?? null;
      const isFresh =
        !!cached &&
        (cached.sourceModifiedAt === sourceModifiedAt ||
          (cached.sourceModifiedAt == null && sourceModifiedAt == null));
      return { item: it, cached, isFresh };
    })
  );

  const misses = cacheChecks.filter((c) => !c.isFresh).map((c) => c.item);
  const cacheHits = items.length - misses.length;

  if (misses.length === 0) {
    return {
      itemsSeen: items.length,
      cacheHits,
      translated: 0,
      failed: 0,
      totalItems,
    };
  }

  // 2. Fetch detail (for `content` field) for misses, in parallel
  const detailFetches = await Promise.all(
    misses.map(async (m) => {
      try {
        const detail: OPhimDetailItem = await MovieServices.getDetailMovie(m.slug);
        return { item: m, detail };
      } catch (err: any) {
        console.warn(`[cron-translation-service] detail fetch failed for ${m.slug}:`, err.message);
        return { item: m, detail: null };
      }
    })
  );

  // Filter to those with NON-EMPTY content. Empty `<p></p>` or whitespace-only
  // content gives Groq nothing to translate; skip rather than waste a slot
  // in the batch.
  const toTranslate = detailFetches
    .filter((d) => {
      const c = d.detail?.movie?.content;
      if (!c) return false;
      // Strip HTML tags to check if there's actual text
      const stripped = c.replace(/<[^>]*>/g, '').trim();
      return stripped.length > 0;
    })
    .map((d) => ({
      movieId: d.item._id,
      slug: d.item.slug,
      content: d.detail!.movie!.content!,
      sourceModifiedAt: d.item.modified?.time ?? null,
    }));

  // Diagnose detail-fetch / empty-content failures so we can see them in logs
  const detailFailedItems = misses.filter((m) => !toTranslate.find((t) => t.movieId === m._id));
  if (detailFailedItems.length > 0) {
    console.log(
      `[cron-translation-service] page ${page}: ${detailFailedItems.length} movies skipped (no content / fetch failed):`,
      detailFailedItems.map((m) => m.slug)
    );
  }

  const detailFailed = detailFailedItems.length;

  if (toTranslate.length === 0) {
    return {
      itemsSeen: items.length,
      cacheHits,
      translated: 0,
      failed: detailFailed,
      totalItems,
    };
  }

  // 3. ONE batched Groq call for all misses on this page
  let translatedMap: Map<string, string>;
  try {
    translatedMap = await translateMovieContentsBatch(
      toTranslate.map((t) => ({ id: t.movieId, content: t.content })),
      locale
    );
  } catch (err: any) {
    console.warn(`[cron-translation-service] batch translate failed on page ${page}:`, err.message);
    return {
      itemsSeen: items.length,
      cacheHits,
      translated: 0,
      failed: detailFailed + toTranslate.length,
      totalItems,
    };
  }

  // 3b. Retry
  const missingFromBatch = toTranslate.filter((t) => !translatedMap.has(t.movieId));
  if (missingFromBatch.length > 0) {
    console.log(
      `[cron-translation-service] page ${page}: Groq omitted ${missingFromBatch.length} entries, retrying:`,
      missingFromBatch.map((m) => m.slug)
    );
    try {
      const retryMap = await translateMovieContentsBatch(
        missingFromBatch.map((t) => ({ id: t.movieId, content: t.content })),
        locale
      );
      retryMap.forEach((v, k) => translatedMap.set(k, v));
    } catch (err: any) {
      console.warn(`[cron-translation-service] retry batch failed on page ${page}:`, err.message);
      // Non-fatal — those items remain unsaved and will be retried next cron run
    }
  }

  // 4. Persist each translation (parallel best-effort)
  let GroqFailed = 0;
  const writes = toTranslate.map((t) => {
    const content = translatedMap.get(t.movieId);
    if (!content) {
      GroqFailed += 1;
      return Promise.resolve();
    }
    return saveCachedTranslation(t.movieId, locale, {
      content,
      translatedAt: Date.now(),
      sourceModifiedAt: t.sourceModifiedAt,
    });
  });
  await Promise.all(writes);

  const translated = toTranslate.length - GroqFailed;

  if (GroqFailed > 0) {
    console.log(
      `[cron-translation-service] page ${page}: ${GroqFailed} entries still missing after retry — will be picked up by next cron run`
    );
  }

  return {
    itemsSeen: items.length,
    cacheHits,
    translated,
    failed: detailFailed + GroqFailed,
    totalItems,
  };
}
