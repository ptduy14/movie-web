import { useEffect, useState } from 'react';
import NotificationDropDown from './notification-dropdown';
import NotificationIcon from './notification-icon';
import { INotification, INotificationDropdownState } from 'types/notification';
import { useSelector } from 'react-redux';
import firebaseServices from 'services/firebase-services';
import { Unsubscribe } from 'firebase/auth';

export default function Notification({
  isOnFixedHeader,
  notificationDropdownState,
  setNotificationDropdownState,
}: {
  isOnFixedHeader: boolean;
  notificationDropdownState: INotificationDropdownState;
  setNotificationDropdownState: React.Dispatch<React.SetStateAction<INotificationDropdownState>>;
}) {
  const user = useSelector((state: any) => state.auth.user);
  const [notifications, setNotifications] = useState<INotification[] | []>([]);
  const [notificationsUnreadCount, setNotificationUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    let unsubscribe: Unsubscribe | undefined = undefined;

    const fetchNotifications = async () => {
      unsubscribe = await firebaseServices.listenToUserNotifications(user.id, handleReciveNotificationData);
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
    })

    setNotificationUnreadCount(tempCount);
    setNotifications(notifications);
  }

  // base on isOnHeaderDefault to choose what state choosing
  const isOpen = isOnFixedHeader
    ? notificationDropdownState.isOpenInHeaderFixed
    : notificationDropdownState.isOpenInHeaderDefault;

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
        />
      )}
    </div>
  );
}
