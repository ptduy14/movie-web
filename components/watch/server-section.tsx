import DetailMovie from 'types/detail-movie';
import { FaCheck } from "react-icons/fa6";

type Props = {
  movie: DetailMovie;
  serverIndex: number;
  handleSetServerIndex: (index: number) => void;
};
export default function ServerSection({ movie, serverIndex, handleSetServerIndex }: Props) {
  return (
    <div className="flex justify-center">
      {movie.episodes.map((item, index) => (
        <div onClick={() => handleSetServerIndex(index)} className={`flex items-center gap-x-2 px-4 py-1  ${serverIndex === index ? 'bg-[#5e5e5e] text-white' : `bg-white text-black cursor-pointer`}`} key={index}>
          {serverIndex === index && <FaCheck size={12} color='#00bd00'/>}{item.server_name}
        </div>
      ))}
    </div>
  );
}
