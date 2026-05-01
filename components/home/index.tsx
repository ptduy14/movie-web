import HeroSection from './hero-section';
import MovieList from '../commons/movie-list';
import MovieServices from 'services/movie-services';

export default async function HomePage() {
  const newlyMoviesFetcher = MovieServices.getNewlyMovies();
  const singleMoviesFetcher = MovieServices.getSingleMovies();
  const tvSeriesFetcher = MovieServices.getTVSeries();
  const cartoonMoviesFetcher = MovieServices.getCartoonMovies();
  const tvShowsFetcher = MovieServices.getTVShows();

  // will improve later with Promise.settled()
  const [newlyMovies, singleMovies, tvSeries, cartoonMovies, tvShows] = await Promise.all([newlyMoviesFetcher, singleMoviesFetcher, tvSeriesFetcher, cartoonMoviesFetcher, tvShowsFetcher]);

  // /v1/api/home now returns response wrapped in `data` (consistent with other v1 endpoints)
  const newlyItems = newlyMovies?.data?.items ?? [];

  return (
    <div className='h-full'>
      <HeroSection movies={newlyItems.slice(0, 5)} />
      <div className="space-y-8">
        <MovieList
          listName="Phim Mới Cập Nhật"
          movies={newlyItems}
          isNewlyMovieItem={true}
        />
        <MovieList movies={singleMovies.data.items.slice(0,10)} listName="Phim Lẻ Mới Cập Nhật" isNewlyMovieItem={false} />
        <MovieList movies={tvSeries.data.items.slice(0,10)} listName="Phim Bộ Mới Cập Nhật" isNewlyMovieItem={false}/>
        <MovieList movies={cartoonMovies.data.items.slice(0,10)} listName="Phim Hoạt Hình Mới Cập Nhật" isNewlyMovieItem={false}/>
        <MovieList movies={tvShows.data.items.slice(0,10)} listName="TV Show Mới Cập Nhật" isNewlyMovieItem={false}/>
      </div>
    </div>
  );
}
