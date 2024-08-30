import Movie from 'types/movie';
import NewlyMovie from 'types/newly-movie';

export default function NewlyMovieItem({ movie }: { movie: NewlyMovie | Movie }) {
  return (
    <div className="h-auto space-y-4">
      <div className="w-full h-[20.625rem]">
        <img className="w-full h-full" src={movie.poster_url} alt="" />
      </div>
      <p>{movie.name}</p>
    </div>
  );
}
