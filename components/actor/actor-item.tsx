import Actor from "types/actor";
import ActorImgDefault from "../../public/default-actor-img.jpg";

export default function ActorItem({ actor }: { actor: Actor | string }) {
  // Kiểm tra nếu actor là chuỗi (chỉ tên diễn viên)
  if (typeof actor === 'string') {
    return (
      <div className="w-full text-center">
        <div className="w-full h-36 rounded-full overflow-hidden bg-cover" style={{backgroundImage: `url(${ActorImgDefault.src})`}}>
        </div>
        <div className="mt-3">{actor}</div>
      </div>
    );
  } 

  // Trường hợp actor là đối tượng đầy đủ
  return (
    <div className="w-full text-center">
      <div className="w-full aspect-square rounded-full overflow-hidden bg-cover bg-no-repeat" style={{backgroundImage: actor.profile_path ? `url(https://image.tmdb.org/t/p/w300${actor.profile_path})` : `url(${ActorImgDefault.src})`}}>
      </div>
      <div className="mt-3">{actor.name}</div>
      <div className="text-sm text-gray-400">{actor.character}</div>
    </div>
  );
}
