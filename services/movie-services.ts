const MovieServices = {
    getNewlyMovies: async (page = 1) => {
        const res = await fetch(`${process.env.API_DOMAIN}/danh-sach/phim-moi-cap-nhat?page=${page}`, {cache: 'force-cache'});
        return res.json();
    },
    getMovies: async (page = 1) => {
        const res = await fetch(`${process.env.API_DOMAIN}/v1/api/danh-sach/phim-le?page=${page}`, {cache: 'force-cache'});
        return res.json();
    },
    getDetailMovie: async (slug: string) => {
        const res = await fetch(`${process.env.API_DOMAIN}/phim/${slug}`);
        return res.json();
    }
}

export default MovieServices;
