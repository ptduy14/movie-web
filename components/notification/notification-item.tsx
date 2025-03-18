import AccountDefaultImg from '../../public/account-default-img.jpg';
import Image from 'next/image';
import { GoDotFill } from 'react-icons/go';
import LikeIcon from '../custom-icons/like-icon';
import { FaCommentDots } from 'react-icons/fa';
import ReplyIcon from '../custom-icons/reply-icon';
import { INotification } from 'types/notification';
import Link from 'next/link';
import { useDropdown } from '../context/dropdown-context';
import firebaseServices from 'services/firebase-services';

export default function NotificationItem({ notification }: { notification: INotification }) {
  const { setNotificationDropdownState } = useDropdown();
  const date = new Date(notification.timestamp);
  const handleReadedNotification = async (notification: INotification) => {
    await firebaseServices.readedNotification(notification);
  }

  return (
    <Link
      onClick={() => {
        setNotificationDropdownState({ isOpenInHeaderDefault: false, isOpenInHeaderFixed: false });
        if (!notification.read) {
          handleReadedNotification(notification);
        }
      }}
      href={`${window.location.origin}/movies/${notification.movieSlug}`}
      className={`${
        !notification.read && 'bg-[#2a1313]'
      } flex pl-2 pr-4 py-2 items-center rounded-lg`}
    >
      <div className="h-12 w-12 mr-5 relative">
        <Image alt="" src={AccountDefaultImg} className="rounded-full w-full h-full" />
        {notification.type === 'react' ? (
          <div className="absolute right-0 bottom-[-2px]">
            <LikeIcon size="20" />
          </div>
        ) : (
          <div className="absolute right-0 bottom-[-2px]">
            <ReplyIcon size="20" />
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2 text-sm">
        <p>
          <b>{notification.userCreatedName}</b> đã{' '}
          {notification.type === 'react' ? 'thích' : 'trả lời'} bình luận của bạn.
        </p>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {`${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
            .toString()
            .padStart(2, '0')}/${date.getFullYear()} lúc ${date
            .getHours()
            .toString()
            .padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`}
        </p>
      </div>

      <div className="w-10 flex justify-end">
        <GoDotFill color="color-bl" size={20} />
      </div>
    </Link>
  );
}
