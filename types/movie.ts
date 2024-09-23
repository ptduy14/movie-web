import Category from "./category"
import Country from "./country"
import NewlyMovie from "./newly-movie"

export default interface Movie extends NewlyMovie{
    type: string,
    sub_docquyen: boolean,
    chieurap: boolean,
    time: string,
    episode_current: string,
    quality: string,
    lang: string,
    category: Category[],
    country: Country[],
    actor: string[],
    director: string[],
    content: string,
    trailer_url: string,
}

