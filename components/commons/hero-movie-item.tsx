import { FaPlay } from 'react-icons/fa';
import MovieSummary from '../movie/movie-summary';
import BtnAddToCollection from '../buttons/btn-add-to-collection';
import DetailMovie from 'types/detail-movie';
import TMDBLogo from '../logos/TMDB-Logo';
import Category from 'types/category';
import { GoDotFill } from 'react-icons/go';
import Link from 'next/link';

export default function HeroMovieItem({ detailMovie }: { detailMovie: DetailMovie }) {
  const movieCategory = detailMovie.movie.category.map((item: Category, index) => (
    <span key={index}>
      {item.name}
      {index < detailMovie.movie.category.length - 1 ? '/' : ''}
    </span>
  ));

  return (
    <div
      className="container-wrapper relative w-full h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${detailMovie.movie.poster_url})` }}
    >
      <div className="absolute inset-0 bg-black opacity-45"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black to-50%"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black to-10%"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black to-10%"></div>
      <div className="absolute inset-0 bg-gradient-to-l from-black to-10%"></div>

      <div className="absolute w-2/4 bottom-[5rem] left-6 space-y-5">
        <h2 className="text-5xl font-bold">{detailMovie.movie.name}</h2>
        <div className="flex items-center gap-x-2 text-sm">
          <div>{detailMovie.movie.year}</div>
          <GoDotFill size={12} />
          <div>{movieCategory}</div>
          <GoDotFill size={12} />
          <div>{detailMovie.movie.episode_current}</div>
        </div>
        <div className="flex items-center gap-x-2">
          <div className="w-[8rem]">
            <TMDBLogo />
          </div>
          <div className="">
            <span className="font-bold">{detailMovie.movie.tmdb.vote_average}</span>
            <span>/10</span>
          </div>
          <div>
            <span>({detailMovie.movie.tmdb.vote_count} votes)</span>
          </div>
        </div>
        <MovieSummary summary={detailMovie.movie.content || 'Đang cập nhật nội dung phim'} />
        <div className="space-x-5 flex items-center">
          <Link
            href={`/movies/${detailMovie.movie.slug}`}
            className="inline-block py-3 px-5 bg-white text-black rounded-md"
          >
            <div className="flex align-top space-x-2">
              <FaPlay size={18} />
              <span className="block leading-4 font-semibold">Xem phim</span>
            </div>
          </Link>
          <BtnAddToCollection variant="primary" detailMovie={detailMovie} />
        </div>
      </div>
    </div>
  );
}
