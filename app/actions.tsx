'use server'

import NewlyMovie from "types/newly-movie";
import MovieServices from "services/movie-services";

export default async function getDescriptionHeroSectionMovies(movies: NewlyMovie[]) {
    const fetcher = movies.map((movie: NewlyMovie) => {
        return MovieServices.getDetailMovie(movie.slug);
    });

    const detailMovies = await Promise.all(fetcher);

    return detailMovies;
}