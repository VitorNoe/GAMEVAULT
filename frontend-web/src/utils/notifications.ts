export interface AppNotification {
  id: string;
  type: 'login' | 'system' | 'wishlist' | 'collection';
  message: string;
  createdAt: string;
  read: boolean;
  route?: string;
}

const STORAGE_KEY = 'gamevault_notifications';

const getRawNotifications = (): AppNotification[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveNotifications = (notifications: AppNotification[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    window.dispatchEvent(new Event('notifications-updated'));
  } catch {
    // Ignore localStorage write errors to avoid breaking login flow.
  }
};

export const getNotifications = (): AppNotification[] => {
  return getRawNotifications().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const getUnreadNotificationsCount = (): number => {
  return getRawNotifications().filter((notification) => !notification.read).length;
};

export const addLoginNotification = () => {
  addNotification('You logged in successfully.', 'login', '/dashboard');
};

export const addNotification = (message: string, type: AppNotification['type'] = 'system', route?: string) => {
  const notifications = getRawNotifications();
  const next: AppNotification = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    message,
    createdAt: new Date().toISOString(),
    read: false,
    route,
  };

  saveNotifications([next, ...notifications].slice(0, 50));
};

export const markAllNotificationsAsRead = () => {
  const notifications = getRawNotifications();
  saveNotifications(
    notifications.map((notification) => ({ ...notification, read: true }))
  );
};

export const markNotificationAsRead = (id: string) => {
  const notifications = getRawNotifications();
  saveNotifications(
    notifications.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification
    )
  );
};
