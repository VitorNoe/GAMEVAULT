/**
 * Notification Context — FCM PoC
 *
 * Provides push notification integration via Firebase Cloud Messaging.
 * In dev/CI where @react-native-firebase is unavailable, falls back to
 * a no-op stub so the app still compiles and runs.
 *
 * Production checklist:
 *  1. Add google-services.json (Android) / GoogleService-Info.plist (iOS)
 *  2. Link @react-native-firebase/app + messaging via pod install / gradle
 *  3. Request permission on first launch
 *  4. Send FCM token to backend POST /users/me/fcm-token
 */
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config';
import { AppNotification } from '../types';

// ---------- FCM Stub (safe import) ----------
let messaging: any = null;
try {
    // Will resolve in a real RN build with Firebase linked
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const firebase = require('@react-native-firebase/messaging');
    messaging = firebase.default;
} catch {
    // Stub — no-op in environments without Firebase
}

interface NotificationContextType {
    notifications: AppNotification[];
    unreadCount: number;
    fcmToken: string | null;
    requestPermission: () => Promise<boolean>;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
    addNotification: (n: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
    undefined,
);

const STORAGE_KEY = config.storage.notificationsKey;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [fcmToken, setFcmToken] = useState<string | null>(null);

    // Load persisted notifications
    useEffect(() => {
        const load = async () => {
            try {
                const json = await AsyncStorage.getItem(STORAGE_KEY);
                if (json) setNotifications(JSON.parse(json));
            } catch {
                // ignore
            }
        };
        load();
    }, []);

    // Persist whenever notifications change
    useEffect(() => {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications)).catch(
            () => { },
        );
    }, [notifications]);

    // FCM setup (no-op if Firebase unavailable)
    useEffect(() => {
        if (!messaging) return;
        const setupFCM = async () => {
            try {
                const authStatus = await messaging().requestPermission();
                const enabled =
                    authStatus === messaging.AuthorizationStatus?.AUTHORIZED ||
                    authStatus === messaging.AuthorizationStatus?.PROVISIONAL;
                if (enabled) {
                    const token = await messaging().getToken();
                    setFcmToken(token);
                    // TODO: POST token to backend /users/me/fcm-token
                }
            } catch (err) {
                console.warn('FCM setup failed:', err);
            }
        };
        setupFCM();

        // Foreground message handler
        const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
            if (remoteMessage?.notification) {
                const newNotif: AppNotification = {
                    id: remoteMessage.messageId || Date.now().toString(),
                    title: remoteMessage.notification.title || '',
                    body: remoteMessage.notification.body || '',
                    type: remoteMessage.data?.type || 'system',
                    data: remoteMessage.data,
                    read: false,
                    timestamp: new Date().toISOString(),
                };
                setNotifications((prev) => [newNotif, ...prev]);
            }
        });

        return unsubscribe;
    }, []);

    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!messaging) return false;
        try {
            const authStatus = await messaging().requestPermission();
            return (
                authStatus === messaging.AuthorizationStatus?.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus?.PROVISIONAL
            );
        } catch {
            return false;
        }
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const addNotification = useCallback(
        (n: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => {
            const notif: AppNotification = {
                ...n,
                id: Date.now().toString(),
                read: false,
                timestamp: new Date().toISOString(),
            };
            setNotifications((prev) => [notif, ...prev]);
        },
        [],
    );

    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.read).length,
        [notifications],
    );

    const value = useMemo(
        () => ({
            notifications,
            unreadCount,
            fcmToken,
            requestPermission,
            markAsRead,
            markAllAsRead,
            clearNotifications,
            addNotification,
        }),
        [
            notifications,
            unreadCount,
            fcmToken,
            requestPermission,
            markAsRead,
            markAllAsRead,
            clearNotifications,
            addNotification,
        ],
    );

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = (): NotificationContextType => {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        throw new Error(
            'useNotifications must be used within NotificationProvider',
        );
    }
    return ctx;
};
