import Movie from 'types/movie';

export default function RegularMovieItem({ movie }: { movie: Movie }) {
  return (
    <a className="block relative h-auto space-y-2" href={`/movies/${movie.slug}`}>
      <div className="w-full h-[20.625rem]">
        <img className="w-full h-full" src={`https://phimimg.com/${movie.poster_url}`} alt="" />
      </div>
      <div>
        <div className="truncate">{movie.name}</div>
        <div className="truncate text-sm text-[#9B9285]">{movie.origin_name}</div>
      </div>
      <div className='absolute top-0 right-0 px-1 bg-[#169f3a]'>{movie.quality}</div>
    </a>
  );
}
