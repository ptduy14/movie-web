import Movie from 'types/movie';
import NewlyMovie from 'types/newly-movie';

export default function NewlyMovieItem({ movie }: { movie: NewlyMovie | Movie }) {
  return (
    <a className="block h-auto space-y-2" href={`/movies/${movie.slug}`}>
      <div className="w-full h-[20.625rem]">
        <img className="w-full h-full" src={movie.poster_url} alt="" />
      </div>
      <div>
        <div className="truncate">{movie.name}</div>
        <div className="truncate text-sm text-[#9B9285]">{movie.origin_name}</div>
      </div>
    </a>
  );
}
