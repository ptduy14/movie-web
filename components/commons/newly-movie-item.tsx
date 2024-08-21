import NewlyMovie from "types/newly-movie";

export default function NewlyMovieItem({ movie }: { movie: NewlyMovie }) {
  return (
    <div className="w-[15.375rem]">
      <img
        className="w-full"
        src={movie.poster_url}
        alt=""
      />
    </div>
  );
}
