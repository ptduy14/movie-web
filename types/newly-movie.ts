import Tmdb from "./tmdb";

export default interface NewlyMovie {
    _id: string,
    name: string,
    slug: string,
    origin_name: string,
    poster_url: string,
    thumb_url: string,
    year: number,
    tmdb: Tmdb
}