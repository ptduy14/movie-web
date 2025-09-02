import { useEffect, useRef } from 'react';
import NotificationList from './notification-list';
import { INotification, INotificationDropdownState } from 'types/notification';
import { IoNotifications, IoCheckmarkDone, IoClose } from 'react-icons/io5';

export default function NotificationDropDown({
  notificationDropdownState,
  setNotificationDropdownState,
  notifications,
}: {
  notificationDropdownState: INotificationDropdownState;
  setNotificationDropdownState: React.Dispatch<React.SetStateAction<INotificationDropdownState>>;
  notifications: INotification[];
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
  }, [setNotificationDropdownState]);

  return (
    <div
      ref={notificationDropdownRef}
      className="absolute bg-black/95 backdrop-blur-sm border border-gray-700 right-0 top-[3.625rem] min-w-[28rem] max-w-[32rem] rounded-xl shadow-2xl overflow-hidden z-50"
    >
      {/* Header */}
      <div className="px-4 py-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IoNotifications className="text-white" size={20} />
            <h3 className="text-white font-semibold text-lg">Thông báo</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="flex items-center space-x-2 px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors"
              onClick={() => {
                // Add mark all as read functionality here
                console.log('Mark all as read');
              }}
            >
              <IoCheckmarkDone size={16} />
              <span>Đánh dấu đã đọc</span>
            </button>
            <button
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
              onClick={() =>
                setNotificationDropdownState({
                  isOpenInHeaderDefault: false,
                  isOpenInHeaderFixed: false,
                })
              }
            >
              <IoClose size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          <NotificationList notifications={notifications} />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <IoNotifications className="text-gray-500 mb-3" size={48} />
            <p className="text-gray-400 text-center">Không có thông báo nào</p>
            <p className="text-gray-500 text-sm text-center mt-1">
              Bạn sẽ nhận được thông báo khi có hoạt động mới
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
