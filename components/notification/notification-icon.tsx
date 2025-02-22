import { IoIosNotifications } from 'react-icons/io';
import { INotificationDropdownState } from 'types/notification';

export default function NotificationIcon({
  isOnFixedHeader,
  setNotificationDropdownState,
}: {
  isOnFixedHeader: boolean;
  setNotificationDropdownState: React.Dispatch<React.SetStateAction<INotificationDropdownState>>;
}) {
  const toogleSetNotificationDropdownState = () => {
    if (isOnFixedHeader) {
      setNotificationDropdownState((prev: INotificationDropdownState) => ({
        ...prev,
        isOpenInHeaderFixed: !prev.isOpenInHeaderFixed
      }));
      return;
    }

    setNotificationDropdownState((prev: INotificationDropdownState) => ({
      ...prev,
      isOpenInHeaderDefault: !prev.isOpenInHeaderDefault
    }));
  };
  return (
    <div className="hover:cursor-pointer" onClick={toogleSetNotificationDropdownState}>
      <IoIosNotifications size={25} />
    </div>
  );
}
