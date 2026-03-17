export interface AppNotification {
  id: string;
  type: 'login' | 'system';
  message: string;
  createdAt: string;
  read: boolean;
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
  const notifications = getRawNotifications();
  const next: AppNotification = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: 'login',
    message: 'You have logged in successfully.',
    createdAt: new Date().toISOString(),
    read: false,
  };

  saveNotifications([next, ...notifications].slice(0, 50));
};

export const markAllNotificationsAsRead = () => {
  const notifications = getRawNotifications();
  saveNotifications(
    notifications.map((notification) => ({ ...notification, read: true }))
  );
};
