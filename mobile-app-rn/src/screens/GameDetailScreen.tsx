import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    RefreshControl,
    Linking,
    Alert,
    StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Card, Button, Badge, MetacriticBadge, GameCover, Loading } from '../components/ui';
import { theme, releaseStatusColor } from '../config/theme';
import { gameService, collectionService, wishlistService } from '../services';
import { Game, CollectionItem, RELEASE_STATUS_LABELS, AVAILABILITY_STATUS_LABELS, COLLECTION_STATUS_LABELS } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../contexts/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'GameDetail'>;

export const GameDetailScreen: React.FC<Props> = ({ route }) => {
    const { gameId } = route.params;
    const { isAuthenticated } = useAuth();
    const [game, setGame] = useState<Game | null>(null);
    const [collectionItem, setCollectionItem] = useState<CollectionItem | null>(null);
    const [inWishlist, setInWishlist] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const gameRes = await gameService.getGameById(gameId);
            setGame(gameRes);

            if (isAuthenticated) {
                try {
                    const colRes = await collectionService.getGameStatus(gameId);
                    setCollectionItem(colRes || null);
                } catch { setCollectionItem(null); }

                try {
                    const wlRes = await wishlistService.checkGame(gameId);
                    setInWishlist(wlRes.inWishlist);
                } catch { setInWishlist(false); }
            }
        } catch (err) {
            console.warn('GameDetail fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [gameId, isAuthenticated]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const handleAddToCollection = async () => {
        if (!isAuthenticated) return;
        setActionLoading(true);
        try {
            await collectionService.addToCollection({ game_id: gameId, status: 'owned' });
            fetchData();
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Could not add to collection.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleWishlist = async () => {
        if (!isAuthenticated) return;
        setActionLoading(true);
        try {
            if (inWishlist) {
                await wishlistService.removeFromWishlist(gameId);
                setInWishlist(false);
            } else {
                await wishlistService.addToWishlist({ game_id: gameId });
                setInWishlist(true);
            }
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Wishlist action failed.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading || !game) return <Loading />;

    return (
        <Screen>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Banner / Cover */}
                <View style={styles.coverSection}>
                    {game.banner_url ? (
                        <Image
                            source={{ uri: game.banner_url }}
                            style={styles.banner}
                            resizeMode="cover"
                        />
                    ) : null}
                    <View style={styles.coverOverlay}>
                        <GameCover
                            uri={game.cover_url}
                            title={game.title}
                            width={120}
                            height={164}
                            borderRadius={theme.borderRadius.lg}
                        />
                        <View style={styles.titleBlock}>
                            <Text style={styles.title}>{game.title}</Text>
                            <Text style={styles.developer}>
                                {game.developer?.name || 'Unknown Developer'}
                            </Text>
                            <View style={styles.tagRow}>
                                <Badge
                                    label={RELEASE_STATUS_LABELS[game.release_status]}
                                    bgColor={`${releaseStatusColor(game.release_status)}25`}
                                    color={releaseStatusColor(game.release_status)}
                                />
                                {game.release_year && (
                                    <Text style={styles.yearText}>{game.release_year}</Text>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Scores & Quick Info */}
                <View style={styles.quickInfo}>
                    {game.metacritic_score ? (
                        <View style={styles.quickItem}>
                            <MetacriticBadge score={game.metacritic_score} />
                            <Text style={styles.quickLabel}>Metacritic</Text>
                        </View>
                    ) : null}
                    {game.average_rating ? (
                        <View style={styles.quickItem}>
                            <Text style={styles.quickValue}>⭐ {game.average_rating.toFixed(1)}</Text>
                            <Text style={styles.quickLabel}>{game.total_reviews} reviews</Text>
                        </View>
                    ) : null}
                    {game.age_rating && (
                        <View style={styles.quickItem}>
                            <Text style={styles.quickValue}>{game.age_rating}</Text>
                            <Text style={styles.quickLabel}>Age Rating</Text>
                        </View>
                    )}
                </View>

                {/* Action Buttons */}
                {isAuthenticated && (
                    <View style={styles.actions}>
                        {collectionItem ? (
                            <Badge
                                label={`In Collection • ${COLLECTION_STATUS_LABELS[collectionItem.status] || collectionItem.status}`}
                                bgColor={`${theme.colors.success}25`}
                                color={theme.colors.success}
                                style={{ paddingVertical: 10, paddingHorizontal: 16 }}
                            />
                        ) : (
                            <Button
                                title="+ Add to Collection"
                                onPress={handleAddToCollection}
                                loading={actionLoading}
                                size="sm"
                            />
                        )}
                        <Button
                            title={inWishlist ? '♥ In Wishlist' : '♡ Wishlist'}
                            onPress={handleToggleWishlist}
                            variant={inWishlist ? 'secondary' : 'outline'}
                            loading={actionLoading}
                            size="sm"
                        />
                    </View>
                )}

                {/* Description */}
                {(game.description || game.synopsis) && (
                    <Card style={styles.descCard}>
                        <Text style={styles.sectionTitle}>About</Text>
                        <Text style={styles.description}>
                            {game.description || game.synopsis}
                        </Text>
                    </Card>
                )}

                {/* Platforms */}
                {game.platforms && game.platforms.length > 0 && (
                    <Card style={styles.descCard}>
                        <Text style={styles.sectionTitle}>Platforms</Text>
                        <View style={styles.platformList}>
                            {game.platforms.map((p) => (
                                <Badge
                                    key={p.id}
                                    label={p.name}
                                    bgColor={theme.colors.cardLight}
                                    color={theme.colors.textSecondary}
                                    style={{ marginRight: 6, marginBottom: 6 }}
                                />
                            ))}
                        </View>
                    </Card>
                )}

                {/* Awards */}
                {game.awards && game.awards.length > 0 && (
                    <Card style={styles.descCard}>
                        <Text style={styles.sectionTitle}>Awards 🏆</Text>
                        {game.awards.map((award) => (
                            <View key={award.id} style={styles.awardRow}>
                                <Text style={styles.awardName}>{award.name}</Text>
                                <Text style={styles.awardDetail}>
                                    {award.category} • {award.year}
                                </Text>
                            </View>
                        ))}
                    </Card>
                )}

                {/* Availability */}
                <Card style={styles.descCard}>
                    <Text style={styles.sectionTitle}>Availability</Text>
                    <Badge
                        label={AVAILABILITY_STATUS_LABELS[game.availability_status] || game.availability_status}
                        bgColor={theme.colors.cardLight}
                        color={theme.colors.text}
                    />
                </Card>

                {/* Trailer link */}
                {game.trailer_url && (
                    <TouchableOpacity
                        style={styles.trailerBtn}
                        onPress={() => Linking.openURL(game.trailer_url!)}
                    >
                        <Text style={styles.trailerText}>▶ Watch Trailer</Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 32 }} />
            </ScrollView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    coverSection: {
        position: 'relative',
        height: 240,
        backgroundColor: theme.colors.surface,
    },
    banner: {
        width: '100%',
        height: 180,
        opacity: 0.4,
    },
    coverOverlay: {
        position: 'absolute',
        bottom: 0,
        left: theme.spacing.lg,
        right: theme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: theme.spacing.lg,
    },
    titleBlock: {
        flex: 1,
        paddingBottom: theme.spacing.sm,
    },
    title: {
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    developer: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
    yearText: {
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.sm,
    },
    quickInfo: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        marginHorizontal: theme.spacing.lg,
    },
    quickItem: {
        alignItems: 'center',
        gap: 4,
    },
    quickValue: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    quickLabel: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textMuted,
    },
    actions: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
    },
    descCard: {
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    description: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        lineHeight: 22,
    },
    platformList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    awardRow: {
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    awardName: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
    },
    awardDetail: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    trailerBtn: {
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.lg,
        backgroundColor: `${theme.colors.error}20`,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
    },
    trailerText: {
        color: theme.colors.error,
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
    },
});
