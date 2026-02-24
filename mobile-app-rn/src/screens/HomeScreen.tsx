import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    FlatList,
    RefreshControl,
    StyleSheet,
} from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Screen, Card, SectionHeader, GameCover, MetacriticBadge, Badge, Loading } from '../components/ui';
import { theme } from '../config/theme';
import { gameService } from '../services';
import { Game } from '../types';
import type { RootStackParamList, MainTabParamList } from '../navigation/RootNavigator';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

type HomeNav = CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'HomeTab'>,
    NativeStackNavigationProp<RootStackParamList>
>;

export const HomeScreen: React.FC = () => {
    const navigation = useNavigation<HomeNav>();
    const { user } = useAuth();
    const { unreadCount } = useNotifications();
    const [featured, setFeatured] = useState<Game[]>([]);
    const [upcoming, setUpcoming] = useState<Game[]>([]);
    const [recentlyAdded, setRecentlyAdded] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [featuredRes, upcomingRes, recentRes] = await Promise.all([
                gameService.getAllGames({ limit: 6, sort: 'metacritic_score', order: 'DESC' }),
                gameService.getUpcomingReleases({ limit: 5 }),
                gameService.getAllGames({ limit: 8, sort: 'created_at', order: 'DESC' }),
            ]);

            setFeatured(featuredRes.games || []);
            setUpcoming(upcomingRes.games || []);
            setRecentlyAdded(recentRes.games || []);
        } catch (err) {
            console.warn('HomeScreen fetch error:', err);
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

    const navigateToGame = (game: Game) => {
        navigation.navigate('GameDetail', { gameId: game.id, title: game.title });
    };

    if (loading) return <Loading />;

    return (
        <Screen>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>
                            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
                        </Text>
                        <Text style={styles.headerSubtitle}>Discover your next favorite game</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.notifBtn}
                        onPress={() => navigation.navigate('Notifications')}
                    >
                        <Text style={{ fontSize: 22 }}>🔔</Text>
                        {unreadCount > 0 && (
                            <View style={styles.notifBadge}>
                                <Text style={styles.notifBadgeText}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Featured / Top Rated */}
                {featured.length > 0 && (
                    <View style={styles.section}>
                        <SectionHeader
                            title="Top Rated"
                            action={{ label: 'See All', onPress: () => navigation.navigate('ExploreTab') }}
                        />
                        <FlatList
                            horizontal
                            data={featured}
                            keyExtractor={(item) => String(item.id)}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => navigateToGame(item)}
                                    activeOpacity={0.8}
                                    style={styles.featuredCard}
                                >
                                    <GameCover
                                        uri={item.cover_url}
                                        title={item.title}
                                        width={140}
                                        height={190}
                                        borderRadius={theme.borderRadius.lg}
                                    />
                                    <Text style={styles.featuredTitle} numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                    <View style={styles.featuredMeta}>
                                        {item.metacritic_score ? (
                                            <MetacriticBadge score={item.metacritic_score} size="sm" />
                                        ) : null}
                                        {item.release_year ? (
                                            <Text style={styles.yearText}>{item.release_year}</Text>
                                        ) : null}
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                {/* Upcoming */}
                {upcoming.length > 0 && (
                    <View style={styles.section}>
                        <SectionHeader title="Upcoming" />
                        {upcoming.map((game) => (
                            <TouchableOpacity
                                key={game.id}
                                style={styles.upcomingRow}
                                onPress={() => navigateToGame(game)}
                                activeOpacity={0.7}
                            >
                                <GameCover
                                    uri={game.cover_url}
                                    title={game.title}
                                    width={56}
                                    height={56}
                                    borderRadius={theme.borderRadius.sm}
                                />
                                <View style={styles.upcomingInfo}>
                                    <Text style={styles.upcomingTitle} numberOfLines={1}>
                                        {game.title}
                                    </Text>
                                    <Text style={styles.upcomingDate}>
                                        {game.release_date || 'TBA'}
                                    </Text>
                                </View>
                                <Badge
                                    label={game.release_status.replace(/_/g, ' ')}
                                    bgColor={`${theme.colors.info}30`}
                                    color={theme.colors.info}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Recently Added */}
                {recentlyAdded.length > 0 && (
                    <View style={styles.section}>
                        <SectionHeader title="Recently Added" />
                        <FlatList
                            horizontal
                            data={recentlyAdded}
                            keyExtractor={(item) => String(item.id)}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => navigateToGame(item)}
                                    activeOpacity={0.8}
                                    style={styles.recentCard}
                                >
                                    <GameCover
                                        uri={item.cover_url}
                                        title={item.title}
                                        width={100}
                                        height={134}
                                    />
                                    <Text style={styles.recentTitle} numberOfLines={2}>
                                        {item.title}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                <View style={{ height: 24 }} />
            </ScrollView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 56,
        paddingBottom: theme.spacing.lg,
    },
    greeting: {
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    headerSubtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    notifBtn: {
        position: 'relative',
        padding: theme.spacing.sm,
    },
    notifBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: theme.colors.error,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    notifBadgeText: {
        color: theme.colors.white,
        fontSize: 10,
        fontWeight: theme.fontWeight.bold,
    },
    section: {
        marginTop: theme.spacing.xl,
    },
    featuredCard: {
        width: 140,
        marginRight: theme.spacing.md,
    },
    featuredTitle: {
        color: theme.colors.text,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
        marginTop: theme.spacing.sm,
    },
    featuredMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    yearText: {
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.xs,
    },
    upcomingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        gap: theme.spacing.md,
    },
    upcomingInfo: {
        flex: 1,
    },
    upcomingTitle: {
        color: theme.colors.text,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
    },
    upcomingDate: {
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.sm,
        marginTop: 2,
    },
    recentCard: {
        width: 100,
        marginRight: theme.spacing.md,
    },
    recentTitle: {
        color: theme.colors.text,
        fontSize: theme.fontSize.xs,
        marginTop: theme.spacing.xs,
    },
});
