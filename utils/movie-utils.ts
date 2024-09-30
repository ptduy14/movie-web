import DetailMovie from "types/detail-movie";

export function isHaveEpisodesMovie(movie: DetailMovie) {
    return movie.movie.type !== 'single' && movie.episodes[0].server_data.length > 1;
}

export function isNotNull(value: string) {
    return value.trim() === '' ? false : true;
}