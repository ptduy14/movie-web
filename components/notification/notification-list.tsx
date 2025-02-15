import NotificationItem from './notification-item';

export default function NotificationList() {
  return (
    <div className="max-h-80 px-2 overflow-y-auto space-y-2">
      <NotificationItem />
      <NotificationItem />
      <NotificationItem />
      <NotificationItem />
      <NotificationItem />
      <NotificationItem />
    </div>
  );
}
