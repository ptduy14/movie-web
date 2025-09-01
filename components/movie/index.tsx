import DetailMovie from 'types/detail-movie';
import { FaPlay } from 'react-icons/fa';
import MovieContent from './movie-content';
import Credit from 'types/credit';
import TMDBLogo from '../logos/TMDB-Logo';
import BtnAddToCollection from '../buttons/btn-add-to-collection';
import Link from 'next/link';
import Image from 'next/image';
import MovieImage from 'types/movie-image';

export default function MoviePage({
  movie,
  credit,
  images,
}: {
  movie: DetailMovie;
  credit: Credit | undefined;
  images: MovieImage[];
}) {
  return (
    <div>
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div
          className="relative w-full h-[37rem] bg-no-repeat bg-cover flex items-end justify-center"
          style={{ backgroundImage: `url(${movie.movie.poster_url})` }}
        >
          <div className="bg-black h-full w-full opacity-65 absolute inset-0"></div>
          <div className="container-wrapper-movie relative flex justify-end">
            <div className="w-1/4 absolute left-0 top-0">
              <div className="relative w-full aspect-[2/3]">
                <Image
                  src={movie.movie.thumb_url}
                  alt={movie.movie.name}
                  fill
                  className="object-cover shadow-custom"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
              </div>
              {movie.movie.episode_current !== 'Trailer' && (
                <Link
                  className="bg-[#e20913] flex items-center justify-center text-center py-3 uppercase font-semibold text-lg gap-x-2 rounded-md mt-5"
                  href={`/movies/watch/${movie.movie.slug}`}
                >
                  <FaPlay size={25} />
                  Xem phim
                </Link>
              )}
            </div>
            <div className=" w-3/4 pl-14 pb-6 space-y-10 ">
              <div>
                <h3 className="text-5xl font-medium">{`${movie.movie.origin_name}`}</h3>
                <h4 className="text-2xl text-[#bbb6ae] font-normal mt-2">{`${movie.movie.name} (${movie.movie.year})`}</h4>
              </div>
              <div className="space-y-5">
                <div>Trạng thái: {movie.movie.episode_current}</div>
                <div>Thời lượng: {movie.movie.time}</div>
                <div className="px-3 py-1 bg-[#169f3a] inline-block rounded-md font-semibold">
                  {movie.movie.quality}
                </div>
                {movie.movie.tmdb.id !== '' && (
                  <div className="flex items-center gap-x-2">
                    <div className="w-[9rem]">
                      <TMDBLogo />
                    </div>
                    <div className="">
                      <span className="font-bold">{movie.movie.tmdb.vote_average}</span>
                      <span>/10</span>
                    </div>
                    <div>
                      <span>({movie.movie.tmdb.vote_count} votes)</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <BtnAddToCollection variant="secondary" detailMovie={movie} />
                  <div className="flex gap-x-2">
                    {movie.movie.category?.map((item, index) => (
                      <Link
                        key={index}
                        className="text-sm block border-[1px] border-gray-600 px-3 p-1 rounded-2xl hover:bg-white hover:text-black hover:border-white transition-all duration-500"
                        href={`/movies/type/${item.slug}`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden">
        {/* Hero Section */}
        <div
          className="relative w-full h-[50vh] bg-no-repeat bg-cover bg-center"
          style={{ backgroundImage: `url(${movie.movie.poster_url})` }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

          {/* Movie Poster and Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex gap-x-4 items-end">
              {/* Movie Poster */}
              <div className="relative w-24 h-36 flex-shrink-0">
                <Image
                  src={movie.movie.thumb_url}
                  alt={movie.movie.name}
                  fill
                  className="object-cover rounded-lg shadow-lg"
                  sizes="96px"
                />
              </div>

              {/* Movie Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white mb-1 truncate">
                  {movie.movie.origin_name}
                </h1>
                <h2 className="text-base text-gray-300 mb-2 truncate">
                  {movie.movie.name} ({movie.movie.year})
                </h2>

                {/* Quick Info */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-300">
                  <span>{movie.movie.episode_current}</span>
                  <span>•</span>
                  <span>{movie.movie.time}</span>
                  <span>•</span>
                  <span className="bg-[#169f3a] px-2 py-0.5 rounded text-white text-xs">
                    {movie.movie.quality}
                  </span>
                </div>

                {/* TMDB Rating */}
                {movie.movie.tmdb.id !== '' && (
                  <div className="flex items-center gap-x-2 mt-2">
                    <div className="w-12 h-3">
                      <TMDBLogo />
                    </div>
                    <div className="text-white text-sm">
                      <span className="font-bold">{movie.movie.tmdb.vote_average}</span>
                      <span>/10</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="bg-gray-900/50 p-4 space-y-4">
          {/* Watch Button */}
          {movie.movie.episode_current !== 'Trailer' && (
            <Link
              className="w-full bg-[#e20913] flex items-center justify-center text-center py-3 uppercase font-semibold text-lg gap-x-2 rounded-lg"
              href={`/movies/watch/${movie.movie.slug}`}
            >
              <FaPlay size={20} />
              Xem phim
            </Link>
          )}

          {/* Collection Button */}
          <div className="flex justify-center">
            <BtnAddToCollection variant="secondary" detailMovie={movie} />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 justify-center">
            {movie.movie.category?.map((item, index) => (
              <Link
                key={index}
                className="text-sm border border-gray-600 px-3 py-1 rounded-full hover:bg-white hover:text-black hover:border-white transition-all duration-300"
                href={`/movies/type/${item.slug}`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <MovieContent movie={movie} credit={credit} images={images} />
    </div>
  );
}
