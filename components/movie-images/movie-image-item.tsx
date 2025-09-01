import MovieImage from 'types/movie-image';
import Image from 'next/image';

interface MovieImageItemProps {
  image: MovieImage;
  onClick?: () => void;
}

export default function MovieImageItem({ image, onClick }: MovieImageItemProps) {
  return (
    <div className="w-full">
      <div
        className="w-full aspect-video rounded-lg overflow-hidden relative cursor-pointer hover:opacity-90 transition-opacity duration-200"
        onClick={onClick}
      >
        <Image
          src={`${process.env.NEXT_PUBLIC_TMDB_IMG_DOMAIN}/t/p/w500${image.file_path}`}
          alt="Movie Image"
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    </div>
  );
}
