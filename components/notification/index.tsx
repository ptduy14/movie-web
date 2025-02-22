import NotificationDropDown from './notification-dropdown';
import NotificationIcon from './notification-icon';
import { INotificationDropdownState } from 'types/notification';

export default function Notification({
  isOnFixedHeader,
  notificationDropdownState,
  setNotificationDropdownState,
}: {
  isOnFixedHeader: boolean;
  notificationDropdownState: INotificationDropdownState;
  setNotificationDropdownState: React.Dispatch<React.SetStateAction<INotificationDropdownState>>;
}) {
  // base on isOnHeaderDefault to choose what state choosing
  const isOpen = isOnFixedHeader
    ? notificationDropdownState.isOpenInHeaderFixed
    : notificationDropdownState.isOpenInHeaderDefault;

  return (
    <>
      <NotificationIcon setNotificationDropdownState={setNotificationDropdownState} isOnFixedHeader={isOnFixedHeader} />
      {isOpen && (
        <NotificationDropDown
          notificationDropdownState={notificationDropdownState}
          setNotificationDropdownState={setNotificationDropdownState}
        />
      )}
    </>
  );
}
