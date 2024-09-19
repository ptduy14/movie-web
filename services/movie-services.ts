const MovieServices = {
    getNewlyMovies: async (page = 1) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_DOMAIN}/danh-sach/phim-moi-cap-nhat?page=${page}`, {cache: 'no-store'});
        return res.json();
    },
    getSingleMovies: async (page = 1) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_DOMAIN}/v1/api/danh-sach/phim-le?page=${page}`, {cache: 'no-store'});
        return res.json();
    },
    getTVSeries: async (page = 1) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_DOMAIN}/v1/api/danh-sach/phim-bo?page=${page}`, {cache: 'no-store'});
        return res.json();
    },
    getCartoonMovies: async (page = 1) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_DOMAIN}/v1/api/danh-sach/hoat-hinh?page=${page}`, {cache: 'no-store'});
        return res.json();
    },
    getTVShows: async (page = 1) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_DOMAIN}/v1/api/danh-sach/tv-shows?page=${page}`, {cache: 'no-store'});
        return res.json();
    },
    getDetailMovie: async (slug: string) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_DOMAIN}/phim/${slug}`);
        return res.json();
    },
    getMoviesFormat: async (slug: string, page: number) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_DOMAIN}/v1/api/danh-sach/${slug}?page=${page}`);
        return res.json();
    },
    getMoviesType: async (slug: string, page: number) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_DOMAIN}/v1/api/the-loai/${slug}?page=${page}`);
        return res.json();
    },
    getMoviesCountry: async (slug: string, page: number) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_DOMAIN}/v1/api/quoc-gia/${slug}?page=${page}`);
        return res.json();
    },
    searchMovie: async (slug: string) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_DOMAIN}/v1/api/tim-kiem?keyword=${slug}&limit=15`);
        return res.json();
    }
}

export default MovieServices;
