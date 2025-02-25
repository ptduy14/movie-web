import DetailMovie from 'types/detail-movie';
import { FaPlay } from 'react-icons/fa';
import MovieContent from './movie-content';
import Credit from 'types/credit';
import TMDBLogo from '../logos/TMDB-Logo';
import BtnAddToCollection from '../buttons/btn-add-to-collection';
import Link from 'next/link';

export default function MoviePage({ movie, credit }: { movie: DetailMovie,  credit: Credit | undefined}) {
  return (
    <div>
      <div
        className="relative w-full h-[37rem] bg-no-repeat bg-cover flex items-end justify-center"
        style={{ backgroundImage: `url(${movie.movie.poster_url})` }}
      >
        <div className="bg-black h-full w-full opacity-65 absolute inset-0"></div>
        <div className="container-wrapper-movie relative flex justify-end">
          <div className="w-1/4 absolute left-0 top-0">
            <img className="w-full shadow-custom" src={movie.movie.thumb_url} alt="" />
            {movie.movie.episode_current !== 'Trailer' && <Link
              className="bg-[#e20913] flex items-center justify-center text-center py-3 uppercase font-semibold text-lg gap-x-2 rounded-md mt-5"
              href={`/movies/watch/${movie.movie.slug}`}
            >
              <FaPlay size={25} />
              Xem phim
            </Link>}
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
              {movie.movie.tmdb.id !== '' && <div className='flex items-center gap-x-2'>
                <div className='w-[9rem]'>
                <TMDBLogo />
                </div>
                <div className=''>
                  <span className='font-bold'>{movie.movie.tmdb.vote_average}</span><span>/10</span>
                </div>
                <div><span>({movie.movie.tmdb.vote_count} votes)</span></div>
              </div>}
              <div className="flex justify-between items-center">
                <BtnAddToCollection variant='secondary' detailMovie={movie}/>
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
      <MovieContent movie={movie} credit={credit}/>
    </div>
  );
}
