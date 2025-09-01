import Actor from 'types/actor';
import ActorImgDefault from '../../public/default-actor-img.jpg';
import Image from 'next/image';

export default function ActorItem({ actor }: { actor: Actor | string }) {
  // Kiểm tra nếu actor là chuỗi (chỉ tên diễn viên)
  if (typeof actor === 'string') {
    return (
      <div className="w-full text-center">
        <div className="w-full aspect-square rounded-full overflow-hidden relative">
          <Image
            src={ActorImgDefault}
            alt={actor}
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="mt-3">{actor}</div>
      </div>
    );
  }

  // Trường hợp actor là đối tượng đầy đủ
  return (
    <div className="w-full text-center">
      <div className="w-full aspect-square rounded-full overflow-hidden relative">
        <Image
          src={
            actor.profile_path
              ? `${process.env.NEXT_PUBLIC_TMDB_IMG_DOMAIN}/t/p/w300${actor.profile_path}`
              : ActorImgDefault
          }
          alt={actor.name}
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="mt-3">{actor.name}</div>
      <div className="text-sm text-gray-400">{actor.character}</div>
    </div>
  );
}
