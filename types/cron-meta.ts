/**
 * Persistent state for the translation cron job, stored at
 * `cron_meta/translations_{locale}` in Firestore.
 *
 * One document per locale so multi-locale cron runs don't fight over the
 * same progress counter.
 */
export interface CronProgress {
  /** Last successfully processed page (1-indexed). 0 means never run. */
  lastPage: number;
  /** Total pages in the OPhim catalog as of last run (recomputed each run). */
  totalPages: number;
  /** Total items in the OPhim catalog as of last run. */
  totalItems: number;
  /** Lifetime count of movies the cron has iterated over. */
  totalProcessed: number;
  /** Lifetime count of movies actually sent to Gemini (cache misses). */
  totalTranslated: number;
  /** Lifetime count of movies skipped because Firestore cache was fresh. */
  totalSkippedCache: number;
  /** Unix ms of the most recent run. */
  lastRunAt: number;
  /** Outcome of the last run. `partial` = ran into time/error mid-batch. */
  lastRunStatus: 'success' | 'partial' | 'failed' | 'idle';
  /** Last error message (if any) — useful for monitoring without log access. */
  lastError: string | null;
}

/**
 * Per-run summary returned by the API route. Useful for cron-monitoring
 * dashboards and debugging via curl.
 */
export interface CronRunResult {
  locale: string;
  startPage: number;
  endPage: number;
  pagesProcessed: number;
  itemsSeen: number;
  cacheHits: number;
  translated: number;
  failed: number;
  durationMs: number;
  status: CronProgress['lastRunStatus'];
  message?: string;
}
