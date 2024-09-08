export default function MovieType({ params } : {params: {slug: string}}) {
    
    return <h1>{params.slug}</h1>
}