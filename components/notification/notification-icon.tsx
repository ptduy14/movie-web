import { IoIosNotifications } from 'react-icons/io';
import { INotificationDropdownState } from 'types/notification';

export default function NotificationIcon({
  isOnFixedHeader,
  setNotificationDropdownState,
  notificationsUnreadCount,
}: {
  isOnFixedHeader: boolean;
  setNotificationDropdownState: React.Dispatch<React.SetStateAction<INotificationDropdownState>>;
  notificationsUnreadCount: number;
}) {
  const toogleSetNotificationDropdownState = () => {
    if (isOnFixedHeader) {
      setNotificationDropdownState((prev: INotificationDropdownState) => ({
        ...prev,
        isOpenInHeaderFixed: !prev.isOpenInHeaderFixed,
      }));
      return;
    }

    setNotificationDropdownState((prev: INotificationDropdownState) => ({
      ...prev,
      isOpenInHeaderDefault: !prev.isOpenInHeaderDefault,
    }));
  };

  const renderUnreadNotificationCount = (notificationsUnreadCount: number) => {
    if (!notificationsUnreadCount) return;

    if (notificationsUnreadCount > 9) {
      return (
        <span className="absolute right-[-5px] top-[-6px] flex items-center justify-center min-w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full">
          9+
        </span>
      );
    } else {
      return (
        <span className="absolute right-[-5px] top-[-6px] flex items-center justify-center min-w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full">
          {notificationsUnreadCount}
        </span>
      );
    }
  };
  return (
    <div
      className="relative cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
      onClick={toogleSetNotificationDropdownState}
      aria-label="Notifications"
    >
      {renderUnreadNotificationCount(notificationsUnreadCount)}
      <IoIosNotifications size={25} />
    </div>
  );
}
