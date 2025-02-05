import Image from 'next/image';
import AccountDefaultImg from '../../public/account-default-img.jpg';
import IComment from 'types/comment';

export default function Comment({ comment }: { comment: IComment }) {
  return (
    <div className="p-3 rounded-lg shadow-sm">
      <div className="flex items-center space-x-3">
        <Image
          src={comment.userAvata || AccountDefaultImg}
          alt="User Profile"
          className="rounded-full"
          width={40}
          height={40}
        />
        <div className="flex flex-row flex-nowrap items-center">
          <p className="font-semibold text-white mr-2">{comment.userName}</p>
          <span className="inline-block mx-1 text-gray-400 text-xs">•</span>
          <p className="text-xs text-gray-400">{comment.timeStamp}</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="w-10"></div>
        <div className="flex-1">
          <p className="text-gray-400 mt-1">{comment.text}</p>
        </div>
      </div>
    </div>
  );
}
