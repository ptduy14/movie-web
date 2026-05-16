import type { IRecentMovie } from 'types/recent-movie';

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
    // QuotaExceeded etc. — drop silently.
  }
}

/** Upsert a movie entry. Bumps `updatedAt` and applies LRU cap. */
export function saveRecentMovie(movie: IRecentMovie): void {
  const store = readStore();
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

/** All entries, sorted by `updatedAt` desc. Empty during SSR. */
export function getRecentMovies(): IRecentMovie[] {
  const store = readStore();
  return Object.values(store).sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

/** Single-entry lookup. */
export function getRecentMovie(movieId: string): IRecentMovie | null {
  return readStore()[movieId] ?? null;
}

/** Drop a single entry by movieId. No-op if missing. */
export function removeRecentMovie(movieId: string): void {
  const store = readStore();
  if (!(movieId in store)) return;
  delete store[movieId];
  writeStore(store);
}

/** Wipe the store. Used after guest → login sync. */
export function clearRecentMovies(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // non-fatal
  }
}
