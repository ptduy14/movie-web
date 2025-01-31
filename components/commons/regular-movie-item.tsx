import Movie from 'types/movie';
import MovieCollection from 'types/movie-collection';

export default function RegularMovieItem({ movie }: { movie: Movie | MovieCollection}) {
  return (
    <a className="block relative h-auto space-y-2" href={`/movies/${movie.slug}`}>
      <div className="w-full h-[20.625rem]">
        <img loading='lazy' className="w-full h-full object-cover" src={`${isMovie(movie) ? process.env.NEXT_PUBLIC_IMG_DOMAIN + movie.thumb_url: movie.thumb_url}`} alt="" />
      </div>
      <div>
        <div className="truncate">{movie.name}</div>
        <div className="truncate text-sm text-[#9B9285]">{movie.origin_name}</div>
      </div>
      <div className='absolute top-0 right-0 px-1 bg-custome-red'>{movie.lang + '-' +movie.quality}</div>
    </a>
  );
}

function isMovie(item: Movie | MovieCollection): item is Movie {
  return (item as Movie).poster_url !== undefined; // Nếu có thuộc tính 'title', thì đó là Movie
}
