import 'server-only';
import { db } from 'lib/firebase-admin';
import type { MovieTranslationDoc, MovieTranslationLocaleData } from 'types/movie-translation';

/**
 * Server-only Firestore cache for AI-translated movie content.
 *
 * Schema: `translations/{movieId}` document with one nested field per locale.
 * See `types/movie-translation.ts` for shape details.
 *
 * Uses Admin SDK so reads/writes bypass client-side security rules — these
 * calls only happen during server rendering and trusted background paths.
 */

const COLLECTION = 'translations';

/**
 * Fetch a movie's translation for a single locale. Returns `null` on cache
 * miss / no document / Firestore error so callers can fall back gracefully
 * without try/catch noise.
 */
export async function getCachedTranslation(
  movieId: string,
  locale: string
): Promise<MovieTranslationLocaleData | null> {
  try {
    const snapshot = await db.collection(COLLECTION).doc(movieId).get();
    if (!snapshot.exists) return null;

    const data = snapshot.data() as MovieTranslationDoc | undefined;
    return (data?.[locale as keyof MovieTranslationDoc] as MovieTranslationLocaleData) ?? null;
  } catch (err: any) {
    console.warn(
      `[firebase-translation-service] getCachedTranslation failed for ${movieId}/${locale}:`,
      err.message
    );
    return null;
  }
}

/**
 * Save a translation under `translations/{movieId}.{locale}`.
 *
 * Uses `set({ [locale]: data }, { merge: true })` so each locale is persisted
 * independently — adding `en` later doesn't clobber an existing `ja` entry.
 *
 * Errors are logged but not thrown — failing to cache shouldn't surface to
 * the user; their request just becomes the next cache miss.
 */
export async function saveCachedTranslation(
  movieId: string,
  locale: string,
  data: MovieTranslationLocaleData
): Promise<void> {
  try {
    await db
      .collection(COLLECTION)
      .doc(movieId)
      .set({ [locale]: data }, { merge: true });
  } catch (err: any) {
    console.warn(
      `[firebase-translation-service] saveCachedTranslation failed for ${movieId}/${locale}:`,
      err.message
    );
  }
}
