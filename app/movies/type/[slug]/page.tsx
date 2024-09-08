import MovieTypePage from "@/components/movie-type"

export default function MovieType({ params } : {params: {slug: string}}) {
    
    return <MovieTypePage slug={params.slug}/>
}