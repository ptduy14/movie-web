import MoviePage from "@/components/movie"
import MovieServices from "services/movie-services"
import { redirect } from "next/navigation";

export default async function Movie({ params } : { params: { slug: string }}) {
    const movie = await MovieServices.getDetailMovie(params.slug);

    if (!movie.status) redirect('/') // temporary solution

    return <MoviePage movie={movie} />
}