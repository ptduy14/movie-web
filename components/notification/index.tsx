import { useEffect, useState } from 'react';
import NotificationDropDown from './notification-dropdown';
import NotificationIcon from './notification-icon';
import NotificationMobile from './notification-mobile';
import { INotification, INotificationDropdownState } from 'types/notification';
import { useSelector } from 'react-redux';
import firebaseServices from 'services/firebase-services';
import { Unsubscribe } from 'firebase/auth';

export default function Notification({
  isOnFixedHeader,
  notificationDropdownState,
  setNotificationDropdownState,
  isMobile = false,
  onCloseMenu,
}: {
  isOnFixedHeader: boolean;
  notificationDropdownState: INotificationDropdownState;
  setNotificationDropdownState: React.Dispatch<React.SetStateAction<INotificationDropdownState>>;
  isMobile?: boolean;
  onCloseMenu?: () => void;
}) {
  const user = useSelector((state: any) => state.auth.user);
  const [notifications, setNotifications] = useState<INotification[] | []>([]);
  const [notificationsUnreadCount, setNotificationUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    let unsubscribe: Unsubscribe | undefined = undefined;

    const fetchNotifications = async () => {
      unsubscribe = await firebaseServices.listenToUserNotifications(
        user.id,
        handleReciveNotificationData
      );
    };

    fetchNotifications();

    return () => {
      if (unsubscribe) {
        console.log('🛑 Unsubscribing from notifications...');
        unsubscribe();
      }
    };
  }, []);

  const handleReciveNotificationData = (notifications: INotification[]) => {
    let tempCount = 0;

    notifications.forEach((item: INotification) => {
      if (!item.read) {
        tempCount++;
      }
    });

    setNotificationUnreadCount(tempCount);
    setNotifications(notifications);
  };

  const handleMarkAllAsRead = async () => {
    if (!user || notificationsUnreadCount === 0) return;
    await firebaseServices.markAllNotificationsRead(user.id);
  };

  // base on isOnHeaderDefault to choose what state choosing
  const isOpen = isOnFixedHeader
    ? notificationDropdownState.isOpenInHeaderFixed
    : notificationDropdownState.isOpenInHeaderDefault;

  // If mobile, return mobile component
  if (isMobile && onCloseMenu) {
    return (
      <NotificationMobile
        notifications={notifications}
        notificationsUnreadCount={notificationsUnreadCount}
        onCloseMenu={onCloseMenu}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    );
  }

  return (
    <div>
      <NotificationIcon
        setNotificationDropdownState={setNotificationDropdownState}
        isOnFixedHeader={isOnFixedHeader}
        notificationsUnreadCount={notificationsUnreadCount}
      />
      {isOpen && (
        <NotificationDropDown
          notificationDropdownState={notificationDropdownState}
          setNotificationDropdownState={setNotificationDropdownState}
          notifications={notifications}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      )}
    </div>
  );
}
