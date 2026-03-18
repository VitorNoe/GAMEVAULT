import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../contexts/NotificationContext';

export const NotificationDisplay: React.FC = () => {
    const { notifications } = useNotification();

    const getBackgroundColor = (type: string) => {
        switch (type) {
            case 'success':
                return 'bg-green-500/90 border-green-600/50';
            case 'error':
                return 'bg-red-500/90 border-red-600/50';
            case 'warning':
                return 'bg-yellow-500/90 border-yellow-600/50';
            case 'info':
            default:
                return 'bg-blue-500/90 border-blue-600/50';
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '!';
            case 'info':
            default:
                return 'ℹ';
        }
    };

    return (
        <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
            <AnimatePresence mode="popLayout">
                {notifications.map((notification) => (
                    <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className={`mb-3 px-4 py-3 rounded-lg text-white font-medium backdrop-blur-sm border pointer-events-auto flex items-center gap-3 max-w-sm ${getBackgroundColor(notification.type)}`}
                    >
                        <span className="text-lg font-bold">{getIcon(notification.type)}</span>
                        <span className="flex-1">{notification.message}</span>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
