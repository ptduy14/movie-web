/**
 * The playable structure of a title.
 *
 * The outer array was originally the provider's "server" list (Vietsub /
 * Thuyết Minh / Lồng Tiếng). With a single embed provider there are no
 * servers to choose between, so the slot now carries SEASONS: one entry per
 * season for a series, exactly one entry for a film. The watch page renders
 * a season selector from this array and an episode list from the selected
 * entry — the same two controls it always had.
 */
export default interface Episode {
    server_data: EpisodeDetail[]
    /** "vidsrc" for a film, "Phần 1" / "Phần 2" … for a series. */
    server_name: string
}


interface EpisodeDetail {
    name: string,
    slug: string,
    filename: string,
    /** The vidsrc iframe URL. This is the only playable address. */
    link_embed: string,
    /**
     * Always `''`. vidsrc serves playback exclusively through its embed —
     * the stream sits behind a short-lived, host-bound gate token and there
     * is no m3u8 to hand to hls.js. Kept so stored progress records written
     * before the migration still type-check.
     */
    link_m3u8: string,
}
