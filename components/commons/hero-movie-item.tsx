import { FaPlay, FaPlus } from "react-icons/fa";
import NewlyMovie from "types/newly-movie";

export default function HeroMovieItem({ movie, movieContent } : { movie: NewlyMovie, movieContent: string }) {
  return (
    <div className="relative w-full h-[50rem]">
      <img
        src={process.env.NEXT_PUBLIC_IMG_DOMAIN + movie.poster_url}
        alt=""
        className="w-full h-full"
        onError={({ currentTarget }) => {
          currentTarget.src = 'https://media.dev.to/cdn-cgi/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fi%2F7buhbtvryuf5a228c512.png'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black to-50%"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black to-10%"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black to-10%"></div>
      <div className="absolute inset-0 bg-gradient-to-l from-black to-10%"></div>
      <div className="absolute w-2/4 top-[20rem] left-6 space-y-5">
        <h2 className="text-4xl font-bold">{movie.name}</h2>
        <span className="block">
          {movieContent}
        </span>
        <div className="space-x-5 flex items-center">
          <a
            href={`/movies/${movie.slug}`}
            className="inline-block py-3 px-5 bg-white text-black rounded-md"
          >
            <div className="flex align-top space-x-2">
              <FaPlay size={18} />
              <span className="block leading-4 font-semibold">Xem phim</span>
            </div>
          </a>
          <button className="flex items-center space-x-2 bg-[#717171] py-3 px-5 rounded-md">
            <FaPlus size={18} />
            <span className="block leading-4 font-semibold">
              Danh sách phát
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
