/**
 * Cross-filter parameters shared by the browse pages, the filter bar and the
 * catalog service.
 *
 * Lives in `types/` rather than next to the catalog service because the
 * filter bar is a client component: importing it from a `server-only` module
 * works today (type imports are erased) but is a trap for the next person who
 * reaches for a value export from the same file.
 */
export type MovieFilters = {
  /** Genre slug. */
  category?: string;
  /** Country slug. */
  country?: string;
  /** Release year, as a string because it comes from the URL. */
  year?: string;
  /** Raw sort token from the URL: '' | 'year_desc' | 'year_asc'. */
  sort?: string;
  /** Audio track: 'vietsub' | 'thuyet-minh' | 'long-tieng'. */
  lang?: string;
};
