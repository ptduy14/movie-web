'use client';

import { useState } from 'react';
import { INotification } from 'types/notification';
import NotificationList from './notification-list';
import { IoChevronDown, IoChevronUp, IoNotifications, IoCheckmarkDone } from 'react-icons/io5';
import { useTranslations, useLocale } from 'next-intl';

interface NotificationMobileProps {
  notifications: INotification[];
  notificationsUnreadCount: number;
  onCloseMenu: () => void;
  onMarkAllAsRead?: () => void;
}

export default function NotificationMobile({
  notifications,
  notificationsUnreadCount,
  onCloseMenu,
  onMarkAllAsRead,
}: NotificationMobileProps) {
  const t = useTranslations('notification');
  const locale = useLocale();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  return (
    <div className="border-t border-gray-800 pt-4">
      {/* Notification Header */}
      <div
        className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <IoNotifications className="text-white" size={24} />
            {notificationsUnreadCount > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full">
                {notificationsUnreadCount > 9 ? '9+' : notificationsUnreadCount}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm">{t('title')}</p>
            <p className="text-gray-400 text-xs">
              {notificationsUnreadCount > 0
                ? t('unreadCount', { count: notificationsUnreadCount })
                : t('allRead')}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <IoChevronUp className="text-gray-400" size={20} />
        ) : (
          <IoChevronDown className="text-gray-400" size={20} />
        )}
      </div>

      {/* Expanded Notification Content */}
      {isExpanded && (
        <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* Mark All as Read Button */}
          {notificationsUnreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center space-x-2 p-2 rounded-lg w-full text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 transition-colors"
            >
              <IoCheckmarkDone size={16} />
              <span className="text-sm font-medium">{t('markRead')}</span>
            </button>
          )}

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.slice(0, 5).map((notification: INotification, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg transition-colors ${
                      !notification.read
                        ? 'bg-red-900/20 border-l-4 border-red-500'
                        : 'bg-gray-800/30 hover:bg-gray-700/50'
                    }`}
                    onClick={onCloseMenu}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-xs">
                          {notification.userCreatedName?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm">
                          <span className="font-semibold">{notification.userCreatedName}</span>{' '}
                          {t('actions.did')}
                          {notification.type === 'react'
                            ? t('actions.liked')
                            : t('actions.replied')}{' '}
                          {t('actions.yourComment')}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {new Date(notification.timestamp).toLocaleString(locale, {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Show More Link */}
                {notifications.length > 5 && (
                  <div className="text-center pt-2">
                    <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                      {t('showMore', { count: notifications.length - 5 })}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <IoNotifications className="text-gray-500 mx-auto mb-3" size={32} />
                <p className="text-gray-400 text-sm">{t('empty')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
