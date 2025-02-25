import { useEffect, useRef } from 'react';
import NotificationList from './notification-list';
import { INotification, INotificationDropdownState } from 'types/notification';

export default function NotificationDropDown({
  notificationDropdownState,
  setNotificationDropdownState,
  notifications
}: {
  notificationDropdownState: INotificationDropdownState;
  setNotificationDropdownState: React.Dispatch<React.SetStateAction<INotificationDropdownState>>;
  notifications: INotification[]
}) {
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const detectCloseNotificationDropdown = (event: MouseEvent) => {
      if (
        notificationDropdownRef.current !== null &&
        !notificationDropdownRef.current.contains(event.target as Node)
      ) {
        setNotificationDropdownState({ isOpenInHeaderDefault: false, isOpenInHeaderFixed: false });
      }
    };

    document.addEventListener('click', detectCloseNotificationDropdown);

    return () => document.removeEventListener('click', detectCloseNotificationDropdown);
  }, [notificationDropdownState]);

  return (
    <div
      ref={notificationDropdownRef}
      className="notification-dropdown absolute bg-black right-0 top-[3.625rem] min-w-[24rem] rounded-lg shadow-lg border border-slate-600 py-4"
    >
      <div className="pb-4 px-5 flex justify-between items-center">
        <div className="font-bold">Thông báo</div>
        <div className="text-sm hover:bg-custome-red rounded-lg transition-all py-2 px-2 cursor-pointer ">
          Đánh dấu đã đọc
        </div>
      </div>
      <div className="">
        {notifications.length > 0 ?  <NotificationList notifications={notifications}/> : <div className="px-5">Không có thông báo</div>}
      </div>
    </div>
  );
}
