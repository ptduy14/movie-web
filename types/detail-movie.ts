import Movie from "./movie";
import Episode from "./episode";

export default interface DetailMovie {
    movie: Movie,
    episodes: Episode[]
}