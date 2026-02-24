import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    StyleSheet,
} from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Screen, Card, GameCover, Badge, MetacriticBadge, EmptyState, Loading } from '../components/ui';
import { theme } from '../config/theme';
import { collectionService } from '../services';
import { CollectionItem, CollectionStats, CollectionStatus, COLLECTION_STATUS_LABELS } from '../types';
import type { RootStackParamList, MainTabParamList } from '../navigation/RootNavigator';

type CollectionNav = CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'CollectionTab'>,
    NativeStackNavigationProp<RootStackParamList>
>;

const STATUS_FILTERS: Array<{ key: string; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'playing', label: 'Playing' },
    { key: 'completed', label: 'Completed' },
    { key: 'backlog', label: 'Backlog' },
    { key: 'owned', label: 'Owned' },
    { key: 'dropped', label: 'Dropped' },
];

export const CollectionScreen: React.FC = () => {
    const navigation = useNavigation<CollectionNav>();
    const [items, setItems] = useState<CollectionItem[]>([]);
    const [stats, setStats] = useState<CollectionStats | null>(null);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [colRes, statsRes] = await Promise.all([
                collectionService.getCollection({ page: 1, limit: 50 }),
                collectionService.getStats(),
            ]);
            setItems(colRes.data?.items || []);
            setStats(statsRes || null);
        } catch (err) {
            console.warn('CollectionScreen error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const handleRemove = (item: CollectionItem) => {
        Alert.alert(
            'Remove from Collection',
            `Remove "${item.Game?.title || 'this game'}" from your collection?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await collectionService.removeFromCollection(item.id);
                            fetchData();
                        } catch { /* ignore */ }
                    },
                },
            ],
        );
    };

    const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter);

    if (loading) return <Loading />;

    return (
        <Screen>
            {/* Header with stats */}
            <View style={styles.headerSection}>
                <Text style={styles.headerTitle}>My Collection</Text>
                {stats && (
                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{stats.total}</Text>
                            <Text style={styles.statLabel}>Games</Text>
                        </View>
                        {stats.average_rating > 0 && (
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>⭐ {stats.average_rating.toFixed(1)}</Text>
                                <Text style={styles.statLabel}>Avg Rating</Text>
                            </View>
                        )}
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>
                                {stats.by_format?.digital || 0}/{stats.by_format?.physical || 0}
                            </Text>
                            <Text style={styles.statLabel}>Digital/Physical</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Status Filters */}
            <FlatList
                horizontal
                data={STATUS_FILTERS}
                keyExtractor={(item) => item.key}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
                renderItem={({ item: f }) => (
                    <TouchableOpacity
                        style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
                        onPress={() => setFilter(f.key)}
                    >
                        <Text
                            style={[
                                styles.filterChipText,
                                filter === f.key && styles.filterChipTextActive,
                            ]}
                        >
                            {f.label}
                            {f.key !== 'all' && stats?.by_status?.[f.key]
                                ? ` (${stats.by_status[f.key]})`
                                : ''}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            {/* Collection Items */}
            {filtered.length === 0 ? (
                <EmptyState
                    icon="📦"
                    title="No games here"
                    subtitle={filter !== 'all' ? 'Try a different filter' : 'Start adding games to your collection!'}
                />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.itemRow}
                            onPress={() => {
                                if (item.game_id) {
                                    navigation.navigate('GameDetail', {
                                        gameId: item.game_id,
                                        title: item.Game?.title,
                                    });
                                }
                            }}
                            onLongPress={() => handleRemove(item)}
                            activeOpacity={0.7}
                        >
                            <GameCover
                                uri={item.Game?.cover_url}
                                title={item.Game?.title || '??'}
                                width={60}
                                height={80}
                                borderRadius={theme.borderRadius.sm}
                            />
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemTitle} numberOfLines={1}>
                                    {item.Game?.title || `Game #${item.game_id}`}
                                </Text>
                                <View style={styles.itemMeta}>
                                    <Badge
                                        label={COLLECTION_STATUS_LABELS[item.status] || item.status}
                                        bgColor={`${theme.colors.primary}20`}
                                        color={theme.colors.primary}
                                    />
                                    <Badge
                                        label={item.format}
                                        bgColor={theme.colors.cardLight}
                                        color={theme.colors.textSecondary}
                                    />
                                </View>
                                {item.hours_played ? (
                                    <Text style={styles.hoursText}>{item.hours_played}h played</Text>
                                ) : null}
                            </View>
                            {item.rating ? (
                                <Text style={styles.ratingText}>⭐ {item.rating}</Text>
                            ) : null}
                        </TouchableOpacity>
                    )}
                />
            )}
        </Screen>
    );
};

const styles = StyleSheet.create({
    headerSection: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 56,
        paddingBottom: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerTitle: {
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: theme.spacing.md,
    },
    stat: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    statLabel: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    filterRow: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    filterChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    filterChipText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        fontWeight: theme.fontWeight.medium,
    },
    filterChipTextActive: {
        color: theme.colors.white,
        fontWeight: theme.fontWeight.bold,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        gap: theme.spacing.md,
    },
    itemInfo: {
        flex: 1,
        gap: 4,
    },
    itemTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
    },
    itemMeta: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 2,
    },
    hoursText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    ratingText: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.warning,
    },
});
