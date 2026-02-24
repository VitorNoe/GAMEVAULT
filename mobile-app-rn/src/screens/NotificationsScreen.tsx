import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { useNotifications } from '../contexts/NotificationContext';
import { Screen, Card, Badge, EmptyState, Button } from '../components/ui';
import { theme } from '../config/theme';
import { AppNotification } from '../types';

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
    release: { icon: '🎮', color: theme.colors.info },
    wishlist: { icon: '💜', color: theme.colors.secondary },
    collection: { icon: '📦', color: theme.colors.success },
    system: { icon: '⚙️', color: theme.colors.textMuted },
};

export const NotificationsScreen: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } =
        useNotifications();

    const renderNotification = ({ item }: { item: AppNotification }) => {
        const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.system;

        return (
            <TouchableOpacity
                style={[styles.notifRow, !item.read && styles.notifUnread]}
                onPress={() => markAsRead(item.id)}
                activeOpacity={0.7}
            >
                <Text style={styles.icon}>{cfg.icon}</Text>
                <View style={styles.notifContent}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifBody} numberOfLines={2}>
                        {item.body}
                    </Text>
                    <View style={styles.notifFooter}>
                        <Badge
                            label={item.type}
                            bgColor={`${cfg.color}25`}
                            color={cfg.color}
                        />
                        <Text style={styles.notifTime}>
                            {new Date(item.timestamp).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    return (
        <Screen>
            {/* Actions Bar */}
            {notifications.length > 0 && (
                <View style={styles.actionsBar}>
                    {unreadCount > 0 && (
                        <Button
                            title={`Mark All Read (${unreadCount})`}
                            onPress={markAllAsRead}
                            variant="secondary"
                            size="sm"
                        />
                    )}
                    <Button
                        title="Clear All"
                        onPress={clearNotifications}
                        variant="ghost"
                        size="sm"
                    />
                </View>
            )}

            {/* Notification List */}
            {notifications.length === 0 ? (
                <EmptyState
                    icon="🔔"
                    title="No notifications"
                    subtitle="You're all caught up!"
                />
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderNotification}
                    contentContainerStyle={{ paddingBottom: 24 }}
                />
            )}
        </Screen>
    );
};

const styles = StyleSheet.create({
    actionsBar: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    notifRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        gap: theme.spacing.md,
    },
    notifUnread: {
        backgroundColor: `${theme.colors.primary}08`,
    },
    icon: {
        fontSize: 24,
        marginTop: 2,
    },
    notifContent: {
        flex: 1,
        gap: 4,
    },
    notifTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    notifBody: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        lineHeight: 18,
    },
    notifFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginTop: 4,
    },
    notifTime: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.primary,
        marginTop: 6,
    },
});
