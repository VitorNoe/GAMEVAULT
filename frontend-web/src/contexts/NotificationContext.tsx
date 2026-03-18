import React, { createContext, useContext, useState } from 'react';

export interface Notification {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    timestamp: Date;
}

export interface NotificationContextType {
    notifications: Notification[];
    addNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        const newNotification: Notification = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            message,
            type,
            timestamp: new Date(),
        };
        setNotifications((prev) => [newNotification, ...prev]);

        // Auto-remove notification after 5 seconds
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id));
        }, 5000);
    };

    const removeNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    const value: NotificationContextType = {
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
