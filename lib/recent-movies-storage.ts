import type { IRecentMovie } from 'types/recent-movie';

/**
 * Guest-only "recent movies" store. Mirrors the Firestore
 * `recentMovies/{userId}/movies` collection shape so that authenticated and
 * unauthenticated users render the same "Continue Watching" UI from
 * structurally-identical data.
 *
 * Why a separate key from `vp` (video-progress-storage)? Two distinct concerns:
 *  - `vp`  → per-movie progress snapshot, written every 20s, used by the
 *            resume prompt on the watch page (lookup by movieId).
 *  - `rm`  → list of recently-watched movies WITH metadata (thumb_url,
 *            slug, name…), used by the home page section (list scan).
 * Splitting them keeps each store focused and avoids accidentally storing
 * 10× metadata blobs alongside high-frequency progress writes.
 */
const STORAGE_KEY = 'rm';
const MAX_ENTRIES = 10;

type RecentMoviesStore = Record<string, IRecentMovie>;

function readStore(): RecentMoviesStore {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function writeStore(store: RecentMoviesStore): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // QuotaExceeded etc. — drop silently; the UI degrades to "no continue watching"
    // rather than crashing the page.
  }
}

/**
 * Upsert a movie entry. Used at watch start (with metadata, no progress yet)
 * and on every periodic save (with progress fields filled in). Always bumps
 * `updatedAt` so the entry floats to the top of the list.
 *
 * LRU eviction: when the store exceeds `MAX_ENTRIES`, the oldest entries by
 * `updatedAt` are dropped. Matches the cap on `vp`.
 */
export function saveRecentMovie(movie: IRecentMovie): void {
  const store = readStore();
  // Merge with existing entry so a periodic-save call carrying only progress
  // fields doesn't clobber the metadata written at watch start (and vice versa).
  store[movie.id] = { ...store[movie.id], ...movie, updatedAt: Date.now() };

  const entries = Object.entries(store);
  if (entries.length > MAX_ENTRIES) {
    entries
      .sort((a, b) => (a[1].updatedAt ?? 0) - (b[1].updatedAt ?? 0))
      .slice(0, entries.length - MAX_ENTRIES)
      .forEach(([id]) => delete store[id]);
  }

  writeStore(store);
}

/**
 * Return all stored entries sorted by `updatedAt` descending (most recent
 * first). Empty array if nothing stored, the store is malformed, or this is
 * called during SSR.
 */
export function getRecentMovies(): IRecentMovie[] {
  const store = readStore();
  return Object.values(store).sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

/**
 * Single-entry lookup. Replaces the former `getVideoProgress(movieId)` from
 * the deprecated `vp` store now that progress lives on the same `IRecentMovie`
 * shape. Callers needing the bare progress fields read `progressTime` etc.
 * directly off the returned object.
 */
export function getRecentMovie(movieId: string): IRecentMovie | null {
  return readStore()[movieId] ?? null;
}

/**
 * Drop all stored entries. Called after a successful guest → logged-in sync
 * so that subsequent reads source from Firestore (the now-canonical store
 * for authenticated users) and we don't re-upload the same data on every
 * login event.
 */
export function clearRecentMovies(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Quota / private-mode failures are non-fatal — the only consequence is
    // a re-sync next login, which is idempotent.
  }
}
