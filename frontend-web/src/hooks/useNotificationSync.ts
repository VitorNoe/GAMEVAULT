import { useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { getNotifications, markAllNotificationsAsRead } from '../utils/notifications';

export const useNotificationSync = () => {
  const { addNotification } = useNotification();

  useEffect(() => {
    // Listen for notifications updates from localStorage
    const handleNotificationsUpdated = () => {
      const notifications = getNotifications();
      const unreadNotifications = notifications.filter((n) => !n.read);

      // Only show unread notifications
      unreadNotifications.forEach((notification) => {
        let type: 'success' | 'error' | 'info' | 'warning' = 'info';

        // Map storage notification types to display types
        if (notification.type === 'login' || notification.type === 'wishlist' || notification.type === 'collection') {
          type = 'success';
        } else if (notification.type === 'system') {
          type = 'info';
        }

        addNotification(notification.message, type);
      });

      // Mark all as read after showing
      if (unreadNotifications.length > 0) {
        markAllNotificationsAsRead();
      }
    };

    window.addEventListener('notifications-updated', handleNotificationsUpdated);
    return () => {
      window.removeEventListener('notifications-updated', handleNotificationsUpdated);
    };
  }, [addNotification]);
};
