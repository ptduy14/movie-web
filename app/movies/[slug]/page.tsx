import MoviePage from "@/components/movie"
import MovieServices from "services/movie-services"
import { redirect } from "next/navigation";
import TMDBServices from "services/tmdb-services";

export default async function Movie({ params } : { params: { slug: string }}) {
    const movie = await MovieServices.getDetailMovie(params.slug);

    if (!movie.status) redirect('/') // temporary solution

    let credit;

    if (movie.movie.tmdb.id !== '') {
        credit = await TMDBServices.getCredits(movie.movie.tmdb.id, movie.movie.tmdb.type);   
    }

    return <MoviePage movie={movie} credit={credit}/>
}