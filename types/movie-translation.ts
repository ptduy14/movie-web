/**
 * One locale's cached translation of a movie's content.
 *
 * `sourceModifiedAt` stores the OPhim `modified.time` value at translation
 * time. The orchestrator compares this against the current `modified.time`
 * to detect content updates and invalidate stale translations.
 */
export interface MovieTranslationLocaleData {
  content: string;
  translatedAt: number; // unix ms — when we generated this translation
  sourceModifiedAt: string | null; // ISO 8601 from OPhim (null if missing)
}

/**
 * Top-level Firestore document shape — keyed by movie `_id` (MongoDB id from OPhim).
 *
 * Nested locale fields make it cheap to fetch all locales in one read and
 * trivial to add new locales (ja, ko, ...) without schema migration.
 */
export interface MovieTranslationDoc {
  en?: MovieTranslationLocaleData;
  ja?: MovieTranslationLocaleData;
  ko?: MovieTranslationLocaleData;
}
