import DetailMovie from "types/detail-movie";

export default function isHaveEpisodesMovie(movie: DetailMovie) {
    return movie.movie.type !== 'single' && movie.episodes[0].server_data.length > 1;
}