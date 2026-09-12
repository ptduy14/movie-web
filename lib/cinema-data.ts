import { readFile } from 'fs/promises';
import { join } from 'path';
import type { CinemaData, CinemaMovie } from 'types/cinema';

const EMPTY: CinemaData = {
  updated_at: '',
  region: 'VN',
  upcoming: [],
  now_playing: [],
};

/**
 * Read the cinema schedule that `scripts/fetch-cinema.mjs` bakes into
 * `public/data/cinema.json` (refreshed daily by `.github/workflows/cinema-cron.yml`).
 *
 * Deliberately a plain file read: the maintenance page must render with zero
 * network calls, so a dead or rate-limited TMDB can never take down the page
 * whose whole job is to say the site is down. A missing/corrupt file degrades
 * to empty lists and the schedule sections simply don't render.
 */
export async function readCinemaData(): Promise<CinemaData> {
  try {
    const raw = await readFile(join(process.cwd(), 'public', 'data', 'cinema.json'), 'utf-8');
    const parsed = JSON.parse(raw) as Partial<CinemaData>;
    return {
      updated_at: parsed.updated_at ?? '',
      region: parsed.region ?? 'VN',
      upcoming: sane(parsed.upcoming),
      now_playing: sane(parsed.now_playing),
    };
  } catch {
    return EMPTY;
  }
}

/** Drop anything that can't be rendered (no poster / no date). */
function sane(items: CinemaMovie[] | undefined): CinemaMovie[] {
  if (!Array.isArray(items)) return [];
  return items.filter((m) => m?.poster_path && m?.release_date && m?.title);
}
