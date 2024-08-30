import HeroSection from './hero-section';
import MovieList from '../commons/movie-list';
import MovieServices from 'services/movie-services';
import Movie from 'types/movie';

export default async function HomePage() {
  const newlyMoviesFetcher = MovieServices.getNewlyMovies();
  const singleMoviesFetcher = MovieServices.getSingleMovies();
  // const newlyMoviesHeroSection = newlyMovies.items.slice(0, 5);

  // const detailMovieFetchers = newlyMoviesHeroSection.map((item: Movie) => {
  //   return MovieServices.getDetailMovie(item.slug);
  // });

  // const detailMovies = await Promise.all(detailMovieFetchers);

  const [newlyMovies, singleMovies] = await Promise.all([newlyMoviesFetcher, singleMoviesFetcher]);

  return (
    <div>
      <HeroSection movies={newlyMovies.items.slice(0, 5)} />
      <div className="space-y-4">
        <MovieList
          listName="Phim mới cập nhật"
          movies={newlyMovies.items}
          isNewlyMovieItem={true}
        />
        <MovieList movies={singleMovies.data.items} listName="Phim Lẻ" isNewlyMovieItem={false} />
        {/* <MovieList listName="Phim Lẻ"/>
        <MovieList listName="Phim Bộ"/>
        <MovieList listName="Hoạt Hình"/>
        <MovieList listName="TV Shows"/> */}
      </div>
    </div>
  );
}
