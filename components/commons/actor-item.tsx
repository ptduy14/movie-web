import Actor from "types/actor";
import ActorImgDefault from "../../public/default-actor-img.jpg";

export default function ActorItem({ actor }: { actor: Actor | string }) {
  // Kiểm tra nếu actor là chuỗi (chỉ tên diễn viên)
  if (typeof actor === 'string') {
    return (
      <div className="w-full text-center">
        <div className="w-full h-32 rounded-full overflow-hidden">
          <img src={ActorImgDefault.src} alt="default actor image" className="w-full h-full" />
        </div>
        <div className="mt-3">{actor}</div>
      </div>
    );
  }

  // Trường hợp actor là đối tượng đầy đủ
  return (
    <div className="w-full text-center">
      <div className="w-full h-32 rounded-full overflow-hidden">
        <img
          src={actor.profile_path ? `https://image.tmdb.org/t/p/w300${actor.profile_path}` : ActorImgDefault.src}
          alt={actor.name}
          className="w-full h-full"
        />
      </div>
      <div className="mt-3">{actor.name}</div>
      <div className="text-sm text-gray-400">{actor.character}</div>
    </div>
  );
}
