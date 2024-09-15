import MovieFormatPage from "@/components/movie-format"

export default function MovieFormat({ params } : {params: {slug: string}}) {
    
    return <MovieFormatPage slug={params.slug}/>
}