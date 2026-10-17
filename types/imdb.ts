export default interface Imdb {
  /** `tt…`, or null when the catalog has no IMDb match. */
  id: string | null;
  vote_average: number;
  vote_count: number;
}
