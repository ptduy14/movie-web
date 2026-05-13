import type { TmdbImagesResponse } from 'types/tmdb-logo';

const TMDBServices = {
  getCredits: async (movieId: number, type: string) => {
    const res = await fetch(
      `https://api.themoviedb.org/3/${type}/${movieId}/credits?language=en-US`,
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization:
            `Bearer ${process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN}`,
        },
      }
    );
    return res.json();
  },

  /**
   * Fetch all artwork (logos, posters, backdrops) for a TMDB title.
   *
   * `include_image_language=vi,en,null` widens the result so we get language-
   * tagged logos (vi/en) AND textless logos (null) in a single call — without
   * it TMDB filters to the project's default language and we'd miss most
   * useful candidates.
   *
   * The `next: { revalidate }` hint is a no-op when the project disables Next
   * data caching (current state on Vercel). Kept so that re-enabling caching
   * picks this up automatically — logos change rarely (~weekly).
   */
  getImages: async (movieId: string, type: string): Promise<TmdbImagesResponse> => {
    const res = await fetch(
      `https://api.themoviedb.org/3/${type}/${movieId}/images?include_image_language=vi,en,null`,
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN}`,
        },
        next: { revalidate: 60 * 60 * 24 * 7 },
      }
    );
    if (!res.ok) throw new Error(`TMDB images ${res.status}`);
    return res.json();
  },
};

export default TMDBServices;
