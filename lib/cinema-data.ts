import { readFile } from 'fs/promises';
import { join } from 'path';
import type { CinemaData, CinemaMovie, CinemaRegion } from 'types/cinema';

/**
 * Which theatrical market each locale gets. A release calendar is only useful
 * where the reader actually is — a Vietnamese reader needs VN dates, an English
 * reader needs US ones (with US posters and English titles to match).
 *
 * Keep in sync with REGIONS in `scripts/fetch-cinema.mjs`.
 */
const REGION_BY_LOCALE: Record<string, string> = {
  vi: 'VN',
  en: 'US',
};

const EMPTY: CinemaRegion = {
  region: '',
  language: '',
  upcoming: [],
  now_playing: [],
};

/**
 * Read the schedule that `scripts/fetch-cinema.mjs` bakes into
 * `public/data/cinema.json` (refreshed daily by `.github/workflows/cinema-cron.yml`).
 *
 * Deliberately a plain file read: the maintenance page must render with zero
 * network calls, so a dead or rate-limited TMDB can never take down the page
 * whose whole job is to say the site is down. A missing/corrupt file degrades
 * to empty lists and the schedule sections simply don't render.
 */
export async function readCinemaSchedule(locale: string): Promise<CinemaRegion> {
  const region = REGION_BY_LOCALE[locale];
  if (!region) return EMPTY;

  try {
    const raw = await readFile(join(process.cwd(), 'public', 'data', 'cinema.json'), 'utf-8');
    const parsed = JSON.parse(raw) as Partial<CinemaData>;
    const data = parsed.regions?.[region];
    if (!data) return EMPTY;

    return {
      region: data.region ?? region,
      language: data.language ?? '',
      upcoming: sane(data.upcoming),
      now_playing: sane(data.now_playing),
    };
  } catch {
    return EMPTY;
  }
}

/** Drop anything that can't be rendered (no poster / no date / no title). */
function sane(items: CinemaMovie[] | undefined): CinemaMovie[] {
  if (!Array.isArray(items)) return [];
  return items.filter((m) => m?.poster_path && m?.release_date && m?.title);
}
