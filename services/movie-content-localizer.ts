import 'server-only';
import { cache } from 'react';
import {
  translateMovieContent,
  translateMovieContentsBatch,
} from './gemini-translation-service';
import {
  getCachedTranslation,
  saveCachedTranslation,
} from './firebase-translation-service';

/**
 * Server-side orchestrator: get the locale-correct content for a movie,
 * using the Firestore translation cache and falling back to Gemini on miss.
 *
 * Decision flow:
 *   1. locale === 'vi' (default) or empty content → return original, no work.
 *   2. Firestore cache hit:
 *      - If `sourceModifiedAt` matches the current OPhim `modified.time` →
 *        return cached translation (fresh).
 *      - If different → translation is stale (OPhim updated content) →
 *        treat as cache miss to re-translate.
 *   3. Cache miss → call Gemini → store in cache → return.
 *   4. On any unexpected error → return original Vietnamese content. The
 *      user sees the Vietnamese text instead of a broken page; we log the
 *      problem for the operator.
 *
 * Pure function from the caller's perspective: input movie id + content,
 * output is the localized content string. All side effects (Firestore writes,
 * Gemini calls) are best-effort and don't propagate failures.
 */
/**
 * Wrapped in React `cache()` so multiple callers within a single render
 * (e.g., `generateMetadata` AND the page component asking for the same
 * movie+locale) share ONE underlying Promise. This prevents a hidden
 * second Gemini API call per page load that would otherwise occur on
 * cache miss before the Firestore write completes.
 */
export const getLocalizedMovieContent = cache(async function getLocalizedMovieContent(
  movieId: string,
  locale: string,
  originalContent: string,
  sourceModifiedAt: string | null = null
): Promise<string> {
  // Trivial early returns
  if (!movieId || !originalContent) return originalContent;
  if (locale === 'vi') return originalContent;

  try {
    // 1. Check cache
    const cached = await getCachedTranslation(movieId, locale);
    if (cached) {
      // 2. Cache invalidation: re-translate if source content has changed.
      // We compare `sourceModifiedAt` from the cache against the current value.
      // - Both null → assume fresh (legacy entries / API didn't return field)
      // - Same value → fresh
      // - Different → stale, drop through to re-translation
      const isFresh =
        cached.sourceModifiedAt === sourceModifiedAt ||
        (cached.sourceModifiedAt == null && sourceModifiedAt == null);

      if (isFresh) {
        return cached.content;
      }
      // else: stale → re-translate below
    }

    // 3. Cache miss / stale → translate via Gemini
    const translated = await translateMovieContent(originalContent, locale);

    // Best-effort cache write — don't await failure into the user request
    saveCachedTranslation(movieId, locale, {
      content: translated,
      translatedAt: Date.now(),
      sourceModifiedAt: sourceModifiedAt ?? null,
    });

    return translated;
  } catch (err: any) {
    console.warn(
      `[movie-content-localizer] failed for ${movieId}/${locale}, falling back to original:`,
      err.message
    );
    return originalContent;
  }
});

// ============================================================================
// BATCH LOCALIZATION (saves Gemini RPM by combining multiple movies in 1 call)
// ============================================================================

export interface BatchLocalizeItem {
  movieId: string;
  content: string;
  sourceModifiedAt?: string | null;
}

/**
 * Localize content for many movies at once, minimizing Gemini API calls.
 *
 * Algorithm:
 *   1. For each input item, check Firestore cache (parallel reads).
 *   2. Items with fresh cache → use cached content.
 *   3. Items with cache miss / stale → collected and sent to Gemini in
 *      ONE batched prompt (5 movies = 1 API call instead of 5).
 *   4. Save each new translation to cache (parallel writes, best-effort).
 *   5. Build result map combining cache hits + fresh translations.
 *
 * Falls back gracefully:
 *   - locale === 'vi' → returns originals immediately, no I/O
 *   - Gemini batch fails → returns originals for the missing items (cache
 *     hits still returned)
 *   - Firestore unreachable → still attempts translation
 *
 * Returned map keys are `movieId`s; values are the localized content strings.
 * Callers can then iterate their items and replace `content` with the map value.
 */
export async function localizeMovieContentsBatch(
  items: BatchLocalizeItem[],
  locale: string
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (items.length === 0) return result;

  // No-op for default locale: just echo originals
  if (locale === 'vi') {
    items.forEach((it) => result.set(it.movieId, it.content));
    return result;
  }

  // 1. Parallel cache lookups
  const cacheLookups = await Promise.all(
    items.map(async (it) => {
      if (!it.movieId || !it.content) return { item: it, cached: null };
      const cached = await getCachedTranslation(it.movieId, locale);
      return { item: it, cached };
    })
  );

  const toTranslate: BatchLocalizeItem[] = [];

  for (const { item, cached } of cacheLookups) {
    if (!item.movieId || !item.content) {
      // Skip empty entries — return original (or empty)
      result.set(item.movieId, item.content);
      continue;
    }

    if (cached) {
      const isFresh =
        cached.sourceModifiedAt === (item.sourceModifiedAt ?? null) ||
        (cached.sourceModifiedAt == null && item.sourceModifiedAt == null);
      if (isFresh) {
        result.set(item.movieId, cached.content);
        continue;
      }
    }

    toTranslate.push(item);
  }

  if (toTranslate.length === 0) return result;

  // 2. ONE Gemini call for all cache misses
  try {
    const translatedMap = await translateMovieContentsBatch(
      toTranslate.map((it) => ({ id: it.movieId, content: it.content })),
      locale
    );

    // 3. Best-effort cache writes (parallel, non-blocking for caller flow)
    const cacheWrites = toTranslate.map((it) => {
      const translated = translatedMap.get(it.movieId);
      if (translated) {
        result.set(it.movieId, translated);
        return saveCachedTranslation(it.movieId, locale, {
          content: translated,
          translatedAt: Date.now(),
          sourceModifiedAt: it.sourceModifiedAt ?? null,
        });
      }
      // Missing in batch response → fall back to original
      result.set(it.movieId, it.content);
      return Promise.resolve();
    });
    await Promise.all(cacheWrites);
  } catch (err: any) {
    console.warn(
      `[movie-content-localizer] batch translation failed, falling back to originals:`,
      err.message
    );
    // Populate remaining items with originals so caller doesn't get undefineds
    toTranslate.forEach((it) => {
      if (!result.has(it.movieId)) result.set(it.movieId, it.content);
    });
  }

  return result;
}
