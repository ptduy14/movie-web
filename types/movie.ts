import Category from "./category"
import Country from "./country"
import NewlyMovie from "./newly-movie"

/**
 * Detail-level movie shape (from `/phim/{slug}`).
 * Re-declares optional NewlyMovie fields as required where the detail
 * endpoint guarantees them.
 */
export default interface Movie extends NewlyMovie{
    poster_url: string,        // Required — detail endpoint always returns
    type: string,              // Required override
    sub_docquyen: boolean,     // Required override
    chieurap: boolean,
    time: string,              // Required override
    episode_current: string,   // Required override
    quality: string,           // Required override
    lang: string,              // Required override
    category: Category[],      // Required override
    country: Country[],        // Required override
    actor: string[],
    director: string[],
    content: string,
    trailer_url: string,
}

