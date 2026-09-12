/** One theatrical title baked into `public/data/cinema.json`. */
export interface CinemaMovie {
  id: number;
  title: { vi: string; en: string };
  /** `YYYY-MM-DD`, already regionalised to VN by the bake script. */
  release_date: string;
  /** TMDB path (`/abc.jpg`); the full URL is composed at render time. */
  poster_path: string | null;
  rating: number | null;
  /** YouTube video key, or null when the title has no trailer yet. */
  trailer: string | null;
}

export interface CinemaData {
  updated_at: string;
  region: string;
  upcoming: CinemaMovie[];
  now_playing: CinemaMovie[];
}
