import HeroSection from "./hero-section";
import MovieList from "../commons/movie-list";
import MovieServices from "services/movie-services";
import Movie from "types/movie";

export default async function HomePage() {

  const newlyMovies = await MovieServices.getNewlyMovies();
  const newlyMoviesHeroSection = newlyMovies.items.slice(0,5);

  const detailMovieFetchers = newlyMoviesHeroSection.map((item: Movie) => {
    return MovieServices.getDetailMovie(item.slug);
  })

  const detailMovies = await Promise.all(detailMovieFetchers);

  return (
    <div>
      <HeroSection movies={newlyMoviesHeroSection} detailMovies={detailMovies}/>
      <div className="space-y-12"> 
        <MovieList listName="Phim mới cập nhật" movies={newlyMovies.items}/>
        {/* <MovieList listName="Phim Lẻ"/>
        <MovieList listName="Phim Bộ"/>
        <MovieList listName="Hoạt Hình"/>
        <MovieList listName="TV Shows"/> */}
      </div>
    </div>
  );
}
