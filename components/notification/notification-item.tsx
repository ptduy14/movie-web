import AccountDefaultImg from '../../public/account-default-img.jpg';
import Image from 'next/image';
import { GoDotFill } from 'react-icons/go';
import LikeIcon from '../custom-icons/like-icon';
import { FaCommentDots } from "react-icons/fa";
import ReplyIcon from '../custom-icons/reply-icon';

export default function NotificationItem() {
  return (
    <div className="flex pl-2 pr-4 py-2 items-center bg-[#2a1313] rounded-lg">
      <div className="h-12 w-12 mr-5 relative">
        <Image alt="" src={AccountDefaultImg} className="rounded-full w-full h-full" />
        {/* <div className="absolute right-0 bottom-[-2px]">
          <LikeIcon size="20" />
        </div> */}
        <div className="absolute right-0 bottom-[-2px]">
          <ReplyIcon size="20" />
        </div>
        
      </div>

      <div className="flex-1 space-y-2 text-sm">
        <p>
          <b>Ngọc Dũng Hoàng</b> đã trả lời bình luận của bạn.
        </p>
        <p className="text-xs font-bold">6 tháng trước</p>
      </div>

      <div className="w-10 flex justify-end">
        <GoDotFill color="color-bl" size={20} />
      </div>
    </div>
  );
}
