import Country from 'types/country';
import DetailMovie from 'types/detail-movie';
import Trailer from './trailer';
import ActorList from '../actor/actor-list';
import Credit from 'types/credit';
import isNonEmpty from 'utils/is-none-empty';
import MovieSummary from './movie-summary';
import CommentSection from '../comment';
import MovieImage from 'types/movie-image';
import MovieImageList from '../movie-images/movie-image-list';

export default function MovieContent({
  movie,
  credit,
  images,
}: {
  movie: DetailMovie;
  credit: Credit | undefined;
  images: MovieImage[];
}) {
  const directors = isNonEmpty(movie.movie.director)
    ? movie.movie.director?.join(', ')
    : 'Đang cập nhật';
  const countries = movie.movie.country.map((item: Country) => item.name).join(', ');

  return (
    <div className="container-wrapper-movie">
      {/* Desktop Layout */}
      <div className="hidden lg:flex justify-end">
        <div className="w-3/4 pl-14 pt-6 space-y-8">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="pb-3 w-1/5 align-top uppercase text-base">Đạo diễn</td>
                <td className="pb-3 font-bold">{directors}</td>
              </tr>
              <tr>
                <td className="pb-3 align-top uppercase text-base">Quốc gia</td>
                <td className="pb-3 font-bold">{countries}</td>
              </tr>
              <tr>
                <td className="pb-3 align-top uppercase text-base">Năm phát hành</td>
                <td className="pb-3 font-bold">{movie.movie.year}</td>
              </tr>
            </tbody>
          </table>
          <MovieSummary summary={movie.movie.content} />
          <div>
            <ActorList movie={movie} credit={credit} />
          </div>
          <div>
            <MovieImageList images={images} />
          </div>
          {movie.movie.trailer_url !== '' && <Trailer trailer={movie.movie.trailer_url} />}
          <CommentSection movie={movie} />
        </div>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden px-4 py-6 space-y-6">
        {/* Movie Details Card */}
        <div className="bg-gray-900/50 rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">Thông tin phim</h3>

          {/* Director */}
          <div className="flex flex-col space-y-1">
            <span className="text-sm text-gray-400 uppercase tracking-wide">Đạo diễn</span>
            <span className="text-white font-medium">{directors}</span>
          </div>

          {/* Country */}
          <div className="flex flex-col space-y-1">
            <span className="text-sm text-gray-400 uppercase tracking-wide">Quốc gia</span>
            <span className="text-white font-medium">{countries}</span>
          </div>

          {/* Release Year */}
          <div className="flex flex-col space-y-1">
            <span className="text-sm text-gray-400 uppercase tracking-wide">Năm phát hành</span>
            <span className="text-white font-medium">{movie.movie.year}</span>
          </div>
        </div>

        {/* Movie Summary */}
        <div className="bg-gray-900/50 rounded-lg p-4">
          <h3 className="text-lg font-bold text-white mb-4">Nội dung phim</h3>
          <MovieSummary summary={movie.movie.content} />
        </div>

        {/* Actors Section */}
        <div className="bg-gray-900/50 rounded-lg p-4">
          <ActorList movie={movie} credit={credit} />
        </div>

        {/* Images Section */}
        {images && images.length > 0 && (
          <div className="bg-gray-900/50 rounded-lg p-4">
            <MovieImageList images={images} />
          </div>
        )}

        {/* Trailer Section */}
        {movie.movie.trailer_url !== '' && (
          <div className="bg-gray-900/50 rounded-lg p-4">
            <Trailer trailer={movie.movie.trailer_url} />
          </div>
        )}

        {/* Comments Section */}
        <div className="bg-gray-900/50 rounded-lg p-4">
          <CommentSection movie={movie} />
        </div>
      </div>
    </div>
  );
}
