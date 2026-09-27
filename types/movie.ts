import Category from "./category"
import Country from "./country"
import NewlyMovie from "./newly-movie"

/**
 * Detail-level title shape (built by `lib/tmdb-adapter.ts` from a TMDB
 * detail response). Re-declares optional `NewlyMovie` fields as required
 * where the detail path always fills them.
 *
 * `quality` stays optional even here: TMDB has no concept of a release
 * quality, and vidsrc only reports one for the 250 titles in its "recently
 * added" feed. The badge hides itself when it is absent.
 */
export default interface Movie extends NewlyMovie{
    poster_url: string,        // Required — detail path always resolves one
    type: string,              // Required override
    sub_docquyen: boolean,     // Required override
    chieurap: boolean,
    time: string,              // Required override
    episode_current: string,   // Required override
    lang: string,              // Required override
    category: Category[],      // Required override
    country: Country[],        // Required override
    actor: string[],
    director: string[],
    content: string,
    /**
     * Which language `content` is actually in.
     *
     * TMDB answers a vi-VN request with an empty overview when no Vietnamese
     * translation exists, in which case the catalog falls back to the English
     * text. Recording that here lets the localizer decide whether a machine
     * translation is needed instead of guessing from the text itself.
     */
    content_lang?: string,
    trailer_url: string,
}
