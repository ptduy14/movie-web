import Country from 'types/country';
import DetailMovie from 'types/detail-movie';

export default function MovieContent({ movie }: { movie: DetailMovie }) {
  const directors = movie.movie.director?.join(', ');
  const actors = movie.movie.actor?.join(', ');
  const countries = movie.movie.country.map((item: Country) => item.name).join(', ');
  return (
    <div className="container-wrapper-movie flex justify-end">
      <div className="w-3/4 pl-14 pt-6 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="uppercase text-base block w-32">Đạo diễn </div>
            <span className="font-bold">{directors}</span>
          </div>
          <div className="flex items-center">
            <div className="uppercase text-base block w-32">Diễn viên </div>
            <span className="font-bold">{actors}</span>
          </div>
          <div className="flex items-center">
            <div className="uppercase text-base block w-32">Quốc gia </div>
            <span className="font-bold">{countries}</span>
          </div>
        </div>
        <div>
            {movie.movie.content}
        </div>
      </div>
    </div>
  );
}
