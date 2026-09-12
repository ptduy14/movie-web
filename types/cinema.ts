/** One theatrical title, already localised to its region's language. */
export interface CinemaMovie {
  id: number;
  title: string;
  /** `YYYY-MM-DD` — the release date in this region, not a global one. */
  release_date: string;
  /** TMDB path (`/abc.jpg`); the full URL is composed at render time. */
  poster_path: string | null;
  rating: number | null;
  /** YouTube video key, or null when the title has no trailer yet. */
  trailer: string | null;
}

/** One region's schedule: its own dates, titles and poster artwork. */
export interface CinemaRegion {
  region: string;
  language: string;
  upcoming: CinemaMovie[];
  now_playing: CinemaMovie[];
}

export interface CinemaData {
  updated_at: string;
  regions: Record<string, CinemaRegion>;
}
