/**
 * A title's TMDB reference.
 *
 * Nullable because the catalog leaves `id` and `type` null for about a
 * fifth of its titles, and `season` is only set for a series entry (the catalog
 * lists each season as its own title). Every reader already guards with
 * `tmdb?.id`, so a null simply switches off the TMDB-backed extras.
 */
export default interface Tmdb {
  type: string | null;
  id: string | null;
  season: number | null;
  vote_average: number;
  vote_count: number;
}
