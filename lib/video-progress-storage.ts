const STORAGE_KEY = 'vp';
const MAX_ENTRIES = 10;

export interface VideoProgressEntry {
  position: number;
  episodeIndex: number;
  episodeLink: string;
  updatedAt: number;
}

type ProgressStore = Record<string, VideoProgressEntry>;

function readStore(): ProgressStore {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function saveVideoProgress(
  movieId: string,
  data: Omit<VideoProgressEntry, 'updatedAt'>
): void {
  const store = readStore();
  store[movieId] = { ...data, updatedAt: Date.now() };

  // LRU eviction: keep only the MAX_ENTRIES most recently updated
  const entries = Object.entries(store);
  if (entries.length > MAX_ENTRIES) {
    entries
      .sort((a, b) => a[1].updatedAt - b[1].updatedAt)
      .slice(0, entries.length - MAX_ENTRIES)
      .forEach(([id]) => delete store[id]);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getVideoProgress(movieId: string): VideoProgressEntry | null {
  return readStore()[movieId] ?? null;
}
