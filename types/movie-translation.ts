/**
 * One locale's cached machine translation of a title's synopsis.
 *
 * `sourceHash` is a short digest of the exact text that was translated. It
 * replaced a timestamp-based check: the previous provider stamped every
 * record with a `modified.time`, TMDB does not, and comparing the source
 * text directly is strictly better anyway — it invalidates when the words
 * change and never when they don't.
 */
export interface MovieTranslationLocaleData {
  content: string;
  /** unix ms — when this translation was generated. */
  translatedAt: number;
  /** Digest of the source text this was translated FROM. */
  sourceHash: string;
  /** Language the source text was in (almost always `en`). */
  sourceLang?: string;
}

/**
 * Firestore document shape, keyed by the app's namespaced media id
 * (`movie-68721`, `tv-1399`).
 *
 * Nested locale fields make it cheap to fetch all locales in one read and
 * trivial to add new ones without a schema migration. Note the direction
 * change since the OPhim era: the source is now English and `vi` is a
 * TRANSLATION target, where before Vietnamese was the source and `en` the
 * target.
 */
export interface MovieTranslationDoc {
  vi?: MovieTranslationLocaleData;
  ja?: MovieTranslationLocaleData;
  ko?: MovieTranslationLocaleData;
}
