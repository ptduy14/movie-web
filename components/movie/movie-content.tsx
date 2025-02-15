import Country from 'types/country';
import DetailMovie from 'types/detail-movie';
import Trailer from './trailer';
import ActorList from '../actor/actor-list';
import Credit from 'types/credit';
import isNonEmpty from 'utils/is-none-empty';
import MovieSummary from './movie-summary';
import CommentSection from '../comment';

export default function MovieContent({ movie, credit }: { movie: DetailMovie, credit: Credit | undefined}) {
  const directors = isNonEmpty(movie.movie.director) ? movie.movie.director?.join(', ') : 'Đang cập nhật';
  const countries = movie.movie.country.map((item: Country) => item.name).join(', ');

  return (
    <div className="container-wrapper-movie flex justify-end">
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
        <MovieSummary summary={movie.movie.content}/>
        <div>
          <ActorList movie={movie} credit={credit}/>
        </div>
        {movie.movie.trailer_url !== '' && <Trailer trailer={movie.movie.trailer_url}/>}
        <CommentSection movie={movie}/>
      </div>
    </div>
  );
}
