import Link from 'next/link';
import Movie from 'types/movie';
import NewlyMovie from 'types/newly-movie';
import Image from 'next/image'

export default function NewlyMovieItem({ movie }: { movie: NewlyMovie | Movie }) {
  return (
    <Link className="block h-auto space-y-2" href={`/movies/${movie.slug}`}>
      <div className="relative w-full aspect-[2/3]">
        <Image src={process.env.NEXT_PUBLIC_IMG_DOMAIN + movie.thumb_url} fill={true} alt='' sizes="100%"/>
      </div>
      <div>
        <div className="truncate">{movie.name}</div>
        <div className="truncate text-sm text-[#9B9285]">{movie.origin_name}</div>
      </div>
    </Link>
  );
}
