const TMDBServices = {
  getCredits: async (movieId: number, type: string) => {
    const res = await fetch(
      `https://api.themoviedb.org/3/${type}/${movieId}/credits?language=en-US`,
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization:
            `Bearer ${process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN}`,
        },
      }
    );
    return res.json();
  },
};

export default TMDBServices;
