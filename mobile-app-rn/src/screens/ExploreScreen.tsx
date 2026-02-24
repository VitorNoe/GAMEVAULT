import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Screen, GameCover, MetacriticBadge, Badge, EmptyState } from '../components/ui';
import { theme, releaseStatusColor } from '../config/theme';
import { gameService } from '../services';
import { Game, RELEASE_STATUS_LABELS } from '../types';
import type { RootStackParamList, MainTabParamList } from '../navigation/RootNavigator';

type ExploreNav = CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'ExploreTab'>,
    NativeStackNavigationProp<RootStackParamList>
>;

export const ExploreScreen: React.FC = () => {
    const navigation = useNavigation<ExploreNav>();
    const [games, setGames] = useState<Game[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchGames = useCallback(async (pageNum: number, query: string, append = false) => {
        try {
            if (pageNum === 1) setLoading(true);
            else setLoadingMore(true);

            const params: any = { page: pageNum, limit: 20, sort: 'title', order: 'ASC' };
            if (query.trim()) params.search = query.trim();

            const res = await gameService.getAllGames(params);
            const fetched = res.games || [];
            const pagination = res.pagination;

            setGames(append ? (prev) => [...prev, ...fetched] : fetched);
            setTotalPages(pagination?.totalPages || 1);
            setPage(pageNum);
        } catch (err) {
            console.warn('ExploreScreen error:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchGames(1, search);
        }, 400);
        return () => clearTimeout(debounce);
    }, [search, fetchGames]);

    const loadMore = () => {
        if (!loadingMore && page < totalPages) {
            fetchGames(page + 1, search, true);
        }
    };

    const navigateToGame = (game: Game) => {
        navigation.navigate('GameDetail', { gameId: game.id, title: game.title });
    };

    const renderGame = ({ item }: { item: Game }) => (
        <TouchableOpacity
            style={styles.gameRow}
            onPress={() => navigateToGame(item)}
            activeOpacity={0.7}
        >
            <GameCover
                uri={item.cover_url}
                title={item.title}
                width={70}
                height={94}
                borderRadius={theme.borderRadius.md}
            />
            <View style={styles.gameInfo}>
                <Text style={styles.gameTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.gameDev} numberOfLines={1}>
                    {item.developer?.name || 'Unknown developer'}
                </Text>
                <View style={styles.gameTags}>
                    <Badge
                        label={RELEASE_STATUS_LABELS[item.release_status] || item.release_status}
                        bgColor={`${releaseStatusColor(item.release_status)}25`}
                        color={releaseStatusColor(item.release_status)}
                    />
                    {item.release_year && (
                        <Text style={styles.yearText}>{item.release_year}</Text>
                    )}
                </View>
            </View>
            {item.metacritic_score ? (
                <MetacriticBadge score={item.metacritic_score} size="sm" />
            ) : null}
        </TouchableOpacity>
    );

    return (
        <Screen>
            {/* Search */}
            <View style={styles.searchContainer}>
                <Text style={styles.headerTitle}>Explore Games</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search games..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                    autoCapitalize="none"
                    returnKeyType="search"
                />
            </View>

            {/* Game List */}
            {loading ? (
                <View style={styles.centerLoader}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : games.length === 0 ? (
                <EmptyState
                    icon="🔍"
                    title="No games found"
                    subtitle={search ? `No results for "${search}"` : 'The catalog is empty'}
                />
            ) : (
                <FlatList
                    data={games}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderGame}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.4}
                    ListFooterComponent={
                        loadingMore ? (
                            <ActivityIndicator
                                style={{ paddingVertical: 16 }}
                                size="small"
                                color={theme.colors.primary}
                            />
                        ) : null
                    }
                />
            )}
        </Screen>
    );
};

const styles = StyleSheet.create({
    searchContainer: {
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
        marginBottom: theme.spacing.md,
    },
    searchInput: {
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: 12,
        color: theme.colors.text,
        fontSize: theme.fontSize.md,
    },
    centerLoader: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        gap: theme.spacing.md,
    },
    gameInfo: {
        flex: 1,
        gap: 4,
    },
    gameTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
    },
    gameDev: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    gameTags: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginTop: 4,
    },
    yearText: {
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.xs,
    },
});
