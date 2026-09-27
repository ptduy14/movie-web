interface MovieCollection {
    id: string,
    lang: string,
    name: string,
    origin_name: string,
    /** Absent when the source never reported one — the badge hides itself. */
    quality?: string,
    slug: string,
    thumb_url: string
}

export default MovieCollection;