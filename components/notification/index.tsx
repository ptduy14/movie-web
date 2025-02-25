import { useEffect } from 'react';
import NotificationDropDown from './notification-dropdown';
import NotificationIcon from './notification-icon';
import { INotificationDropdownState } from 'types/notification';
import { useSelector } from 'react-redux';
import firebaseServices from 'services/firebase-services';

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

  useEffect(() => {
    if (!user) return;
    let unsubscribe: (() => void) | null = null;

    const fetchNotifications = async () => {
      unsubscribe = await firebaseServices.listenToUserNotifications(user.id);
    };

    fetchNotifications();

    return () => {
      if (unsubscribe) {
        console.log('🛑 Unsubscribing from notifications...');
        unsubscribe();
      }
    };
  }, []);

  // base on isOnHeaderDefault to choose what state choosing
  const isOpen = isOnFixedHeader
    ? notificationDropdownState.isOpenInHeaderFixed
    : notificationDropdownState.isOpenInHeaderDefault;

  return (
    <>
      <NotificationIcon
        setNotificationDropdownState={setNotificationDropdownState}
        isOnFixedHeader={isOnFixedHeader}
      />
      {isOpen && (
        <NotificationDropDown
          notificationDropdownState={notificationDropdownState}
          setNotificationDropdownState={setNotificationDropdownState}
        />
      )}
    </>
  );
}
