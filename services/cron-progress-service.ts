import 'server-only';
import { db } from 'lib/firebase-admin';
import type { CronProgress } from 'types/cron-meta';

const COLLECTION = 'cronMeta';

const docId = (locale: string) => `translations_${locale}`;

const DEFAULT_PROGRESS: CronProgress = {
  lastPage: 0,
  totalPages: 0,
  totalItems: 0,
  totalProcessed: 0,
  totalTranslated: 0,
  totalSkippedCache: 0,
  lastRunAt: 0,
  lastRunStatus: 'idle',
  lastError: null,
};

/**
 * Read the cron's persisted progress for a given locale.
 *
 * Returns sensible defaults if the document doesn't exist yet (first run)
 * or on Firestore failure — the cron then starts from page 1 as if fresh.
 */
export async function getCronProgress(locale: string): Promise<CronProgress> {
  try {
    const snap = await db.collection(COLLECTION).doc(docId(locale)).get();
    if (!snap.exists) return { ...DEFAULT_PROGRESS };
    return { ...DEFAULT_PROGRESS, ...(snap.data() as Partial<CronProgress>) };
  } catch (err: any) {
    console.warn(
      `[cron-progress-service] read failed for ${locale}, using defaults:`,
      err.message
    );
    return { ...DEFAULT_PROGRESS };
  }
}

/**
 * Persist the cron's progress. Called AFTER each successful page so that a
 * crash mid-run can be resumed from the last fully-processed page.
 *
 * Errors are logged but not thrown — the run still completes, the next run
 * just won't know to skip ahead.
 */
export async function saveCronProgress(
  locale: string,
  progress: CronProgress
): Promise<void> {
  try {
    await db.collection(COLLECTION).doc(docId(locale)).set(progress, { merge: true });
  } catch (err: any) {
    console.warn(
      `[cron-progress-service] save failed for ${locale}:`,
      err.message
    );
  }
}
