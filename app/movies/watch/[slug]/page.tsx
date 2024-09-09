import MovieWatchPage from "@/components/watch";
import MovieServices from "services/movie-services";

export default async function MovieWatch({ params }: { params: { slug: string } }) {
    const movie = await MovieServices.getDetailMovie(params.slug);

  return <MovieWatchPage movie={movie}/>;
}
