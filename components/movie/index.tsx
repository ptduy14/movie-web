import DetailMovie from 'types/detail-movie';
import { FaPlus } from 'react-icons/fa6';
import { FaPlay } from "react-icons/fa";
import MovieContent from './movie-content';

export default function MoviePage({ movie }: { movie: DetailMovie }) {
  return (
    <div>
      <div
        className="relative w-full h-[37rem] bg-no-repeat bg-cover flex items-end justify-center"
        style={{ backgroundImage: `url(${movie.movie.thumb_url})` }}
      >
        <div className="bg-black h-full w-full opacity-65 absolute inset-0"></div>
        <div className="container-wrapper-movie relative flex justify-end z-10">
          <div className="w-1/4 absolute left-0 top-0">
            <img className="w-full" src={movie.movie.poster_url} alt="" />
            <a className="bg-[#e20913] flex items-center justify-center text-center py-3 uppercase font-semibold text-lg gap-x-2 rounded-md mt-5" href=''><FaPlay size={25}/>Xem phim</a>
          </div>
          <div className=" w-3/4 pl-14 pb-6 space-y-10 ">
            <div>
              <h3 className="text-5xl font-medium">{`${movie.movie.origin_name}`}</h3>
              <h4 className="text-2xl text-[#bbb6ae] font-normal mt-2">{`${movie.movie.name} (${movie.movie.year})`}</h4>
            </div>
            <div className="space-y-4"> 
              <div>Trạng thái: {movie.movie.episode_current}</div>
              <div>Thời lượng: {movie.movie.time}</div>
              <div className="px-3 py-1 bg-[#169f3a] inline-block rounded-md font-semibold">
                {movie.movie.quality}
              </div>
              <div className="flex justify-between items-center">
                <button className="flex items-center bg-black px-3 py-2 rounded-md gap-x-2">
                  <FaPlus /> Bộ sưu tập
                </button>
                <div className='flex gap-x-2'>
                  {movie.movie.category?.map((item, index) => (
                    <span
                      key={index}
                      className="text-sm block border-[1px] border-gray-600 px-3 p-1 rounded-2xl"
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MovieContent movie={movie}/>
    </div>
  );
}
