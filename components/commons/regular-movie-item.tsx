import Movie from 'types/movie';

export default function RegularMovieItem({ movie }: { movie: Movie }) {
  return (
    <a className="block relative h-auto space-y-2" href={`/movies/${movie.slug}`}>
      <div className="w-full h-[20.625rem]">
        <img loading='lazy' className="w-full h-full" src={`${process.env.NEXT_PUBLIC_IMG_DOMAIN + movie.thumb_url}`} alt="" />
      </div>
      <div>
        <div className="truncate">{movie.name}</div>
        <div className="truncate text-sm text-[#9B9285]">{movie.origin_name}</div>
      </div>
      <div className='absolute top-0 right-0 px-1 bg-[#e10711]'>{movie.lang + '-' +movie.quality}</div>
    </a>
  );
}
