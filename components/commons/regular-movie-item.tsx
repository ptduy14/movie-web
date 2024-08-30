import Movie from 'types/movie';

export default function RegularMovieItem({ movie }: { movie: Movie }) {
  return (
    <div className="relative h-auto">
      <div className="w-full h-[20.625rem]">
        <img className="w-full h-full" src={`https://phimimg.com/${movie.poster_url}`} alt="" />
      </div>
      <p className='mt-4'>{movie.name}</p>

      <div className='absolute top-0 right-0 px-1 bg-[#169f3a]'>{movie.quality}</div>
    </div>
  );
}
