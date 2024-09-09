export default interface Episode {
    server_data: EpisodeDetail[]
    server_name: string
}


interface EpisodeDetail {
    name: string,
    slug: string,
    filename: string,
    link_embed: string,
    link_m3u8: string,
}