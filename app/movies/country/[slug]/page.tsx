import MovieCountryPage from "@/components/movie-country";

export default function MovieCountry({ params }: { params: { slug: string } }) {
    return <MovieCountryPage slug={params.slug}/>
}