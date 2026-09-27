import 'server-only';
import { cache } from 'react';
import { createHash } from 'crypto';
import { translateMovieContent, translateMovieContentsBatch } from './groq-translation-service';
import { getCachedTranslation, saveCachedTranslation } from './firebase-translation-service';

/**
 * Resolve a title's synopsis in the active locale.
 *
 * TMDB supplies the synopsis already localized for most well-known titles.
 * For the long tail it answers a vi-VN request with an empty overview, and
 * the catalog falls back to the English text — marking it via `content_lang`.
 * This module is what turns that English text into Vietnamese, cached in
 * Firestore so each title is translated once.
 *
 * Direction note: this used to run Vietnamese → English, because the old
 * provider was a Vietnamese catalog. It now runs English → Vietnamese. The
 * practical consequence is that the ENGLISH site needs no translation at all
 * and the Vietnamese one carries the quota.
 *
 * Every failure path returns the source text. A synopsis in the wrong
 * language is a much smaller problem than a page that won't render.
 */

/**
 * Short digest of the source text, used to invalidate a cached translation
 * when the upstream synopsis is rewritten. 16 hex chars is ample: a
 * collision would reuse one title's translation for a rewrite of the same
 * title, and the cost of that is one slightly stale paragraph.
 */
function hashSource(content: string): string {
  return createHash('sha1').update(content).digest('hex').slice(0, 16);
}

/**
 * Wrapped in React `cache()` so multiple callers within a single render
 * (e.g. `generateMetadata` AND the page component asking for the same
 * title) share ONE underlying promise. Without it, a cache miss would fire
 * a second Groq call before the first Firestore write landed.
 */
export const getLocalizedMovieContent = cache(async function getLocalizedMovieContent(
  movieId: string,
  locale: string,
  content: string,
  contentLang: string = 'en'
): Promise<string> {
  if (!movieId || !content) return content;
  // Already in the right language — the overwhelmingly common case, since
  // TMDB translates the popular catalog itself.
  if (contentLang === locale) return content;

  const sourceHash = hashSource(content);

  try {
    const cached = await getCachedTranslation(movieId, locale);
    if (cached && cached.sourceHash === sourceHash) return cached.content;

    const translated = await translateMovieContent(movieId, content, locale, contentLang);

    // Best-effort cache write — a failure here just means the next reader
    // pays for the translation again.
    saveCachedTranslation(movieId, locale, {
      content: translated,
      translatedAt: Date.now(),
      sourceHash,
      sourceLang: contentLang,
    });

    return translated;
  } catch (err: any) {
    console.warn(
      `[movie-content-localizer] failed for ${movieId}/${locale}, falling back to source:`,
      err.message
    );
    return content;
  }
});

// ============================================================================
// BATCH LOCALIZATION (saves Groq RPM by combining multiple titles in 1 call)
// ============================================================================

export interface BatchLocalizeItem {
  movieId: string;
  content: string;
  /** Language `content` is in. Defaults to English. */
  contentLang?: string;
}

/**
 * Localize many synopses at once, minimizing Groq calls.
 *
 *   1. Parallel Firestore cache reads.
 *   2. Fresh hits are used as-is.
 *   3. Everything else goes to Groq in ONE batched prompt.
 *   4. New translations are written back in parallel.
 *
 * Degrades in every direction: items already in the target language never
 * leave step 0, a Groq failure yields the source text, and an unreachable
 * Firestore only costs a repeated translation.
 */
export async function localizeMovieContentsBatch(
  items: BatchLocalizeItem[],
  locale: string
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (items.length === 0) return result;

  const pending: (BatchLocalizeItem & { sourceHash: string; sourceLang: string })[] = [];

  const lookups = await Promise.all(
    items.map(async (item) => {
      const sourceLang = item.contentLang ?? 'en';
      if (!item.movieId || !item.content || sourceLang === locale) {
        return { item, sourceLang, cached: null, skip: true as const };
      }
      const cached = await getCachedTranslation(item.movieId, locale);
      return { item, sourceLang, cached, skip: false as const };
    })
  );

  for (const { item, sourceLang, cached, skip } of lookups) {
    if (skip) {
      result.set(item.movieId, item.content);
      continue;
    }
    const sourceHash = hashSource(item.content);
    if (cached && cached.sourceHash === sourceHash) {
      result.set(item.movieId, cached.content);
      continue;
    }
    pending.push({ ...item, sourceHash, sourceLang });
  }

  if (pending.length === 0) return result;

  try {
    const translatedMap = await translateMovieContentsBatch(
      pending.map((it) => ({ id: it.movieId, content: it.content })),
      locale,
      pending[0].sourceLang
    );

    await Promise.all(
      pending.map((it) => {
        const translated = translatedMap.get(it.movieId);
        if (!translated) {
          result.set(it.movieId, it.content);
          return Promise.resolve();
        }
        result.set(it.movieId, translated);
        return saveCachedTranslation(it.movieId, locale, {
          content: translated,
          translatedAt: Date.now(),
          sourceHash: it.sourceHash,
          sourceLang: it.sourceLang,
        });
      })
    );
  } catch (err: any) {
    console.warn(
      '[movie-content-localizer] batch translation failed, falling back to sources:',
      err.message
    );
    pending.forEach((it) => {
      if (!result.has(it.movieId)) result.set(it.movieId, it.content);
    });
  }

  return result;
}
