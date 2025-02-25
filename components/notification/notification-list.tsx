import { INotification } from 'types/notification';
import NotificationItem from './notification-item';

export default function NotificationList({notifications}: {notifications: INotification[]}) {
  return (
    <div className="max-h-80 px-2 overflow-y-auto space-y-2">
      {notifications.map((notification: INotification, index: number) => <NotificationItem key={index} notification={notification}/>)}
    </div>
  );
}
