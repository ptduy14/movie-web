/**
 * TMDB media types.
 *
 * Until v3 this file held the whole browse taxonomy (genre ids, country ISO
 * codes, format definitions) for TMDB discover. The catalog speaks slugs natively,
 * so that moved to `constants/catalog-taxonomy.ts`; what is left is the one
 * type every TMDB-facing module still needs.
 */
export type MediaType = 'movie' | 'tv';
