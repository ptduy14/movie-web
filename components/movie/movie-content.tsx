import Country from 'types/country';
import DetailMovie from 'types/detail-movie';
import Trailer from './trailer';
import replacePTag from 'utils/replace-p-tag';

export default function MovieContent({ movie }: { movie: DetailMovie }) {
  const directors = movie.movie.director?.join(', ');
  const actors = movie.movie.actor?.join(', ');
  const countries = movie.movie.country.map((item: Country) => item.name).join(', ');
  return (
    <div className="container-wrapper-movie flex justify-end">
      <div className="w-3/4 pl-14 pt-6 space-y-8">
        <table className="w-full">
          <tbody>
            <tr>
              <td className="pb-3 w-1/6 align-top uppercase text-base">Đạo diễn</td>
              <td className="pb-3 font-bold">{directors}</td>
            </tr>
            <tr>
              <td className="pb-3 align-top uppercase text-base">Diễn viên</td>
              <td className="pb-3 font-bold">{actors}</td>
            </tr>
            <tr>
              <td className="pb-3 align-top uppercase text-base">Quốc gia</td>
              <td className="pb-3 font-bold">{countries}</td>
            </tr>
          </tbody>
        </table>
        <div>{replacePTag(movie.movie.content)}</div>
        {movie.movie.trailer_url !== '' && <Trailer trailer={movie.movie.trailer_url}/>}
      </div>
    </div>
  );
}
