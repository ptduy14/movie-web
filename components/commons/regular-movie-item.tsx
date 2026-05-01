import Link from 'next/link';
import Movie from 'types/movie';
import MovieCollection from 'types/movie-collection';
import Image from 'next/image';
import RatingBadge from './badges/rating-badge';
import QualityLangBadge from './badges/quality-lang-badge';
import ExclusiveBadge from './badges/exclusive-badge';
import NewUpdateBadge from './badges/new-update-badge';

export default function RegularMovieItem({ movie }: { movie: Movie | MovieCollection }) {
  // MovieCollection lacks v1/home extension fields — narrow with type guard
  const isMovieType = isMovie(movie);

  return (
    <Link className="block relative h-auto space-y-2" href={`/movies/${movie.slug}`}>
      <div className="relative w-full aspect-[2/3] overflow-hidden rounded">
        <Image
          src={`${isMovieType ? process.env.NEXT_PUBLIC_IMG_DOMAIN + movie.thumb_url : movie.thumb_url}`}
          fill={true}
          alt={movie.name}
          sizes="100%"
        />

        {/* Top-left: Exclusive or NEW (only available on Movie shape) */}
        {isMovieType && (
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10">
            {movie.sub_docquyen ? (
              <ExclusiveBadge />
            ) : (
              <NewUpdateBadge modifiedAt={movie.modified?.time} />
            )}
          </div>
        )}

        {/* Top-right: quality + lang */}
        <div className="absolute top-1.5 right-1.5 z-10">
          <QualityLangBadge quality={movie.quality} lang={movie.lang} />
        </div>

        {/* Bottom overlay: ratings (only Movie has imdb/tmdb) */}
        {isMovieType && (movie.imdb || movie.tmdb) && (
          <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1.5 z-10 bg-gradient-to-t from-black/80 to-transparent">
            <RatingBadge imdb={movie.imdb} tmdb={movie.tmdb} />
          </div>
        )}
      </div>
      <div>
        <div className="truncate">{movie.name}</div>
        <div className="truncate text-sm text-[#9B9285]">{movie.origin_name}</div>
      </div>
    </Link>
  );
}

function isMovie(item: Movie | MovieCollection): item is Movie {
  // Movie items (from OPhim list/detail endpoints) carry MongoDB `_id`;
  // MovieCollection (from Firestore) uses `id` instead.
  return (item as Movie)._id !== undefined;
}
