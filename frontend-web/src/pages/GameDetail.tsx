import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { gameService } from '../services/gameService';
import { wishlistService } from '../services/wishlistService';
import { collectionService } from '../services/collectionService';
import { reviewService, Review } from '../services/reviewService';
import { Game } from '../types/game.types';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { ReviewsList } from '../components/games/ReviewsList';
import { useAuth } from '../hooks/useAuth';
import { RELEASE_STATUS_LABELS, AVAILABILITY_STATUS_LABELS, ROUTES } from '../utils/constants';

const PLACEHOLDER_IMAGE = 'https://placehold.co/400x600/1a1a2e/a78bfa?text=No+Cover';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export const GameDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [game, setGame] = useState<Game | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Wishlist state (backend API)
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistItemId, setWishlistItemId] = useState<number | null>(null);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    // Collection state (backend API)
    const [collectionStatus, setCollectionStatus] = useState<string | null>(null);
    const [collectionItemId, setCollectionItemId] = useState<number | null>(null);
    const [collectionLoading, setCollectionLoading] = useState(false);

    // Reviews
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    const gameId = id ? parseInt(id) : 0;

    const fetchReviews = useCallback(async () => {
        if (!gameId) return;
        setReviewsLoading(true);
        try {
            const response = await reviewService.getGameReviews(gameId, { limit: 20 });
            setReviews(response.data?.reviews || response.data || []);
        } catch {
            // Reviews are non-critical, fail silently
        } finally {
            setReviewsLoading(false);
        }
    }, [gameId]);

    useEffect(() => {
        const fetchGame = async () => {
            if (!gameId) return;

            try {
                setLoading(true);
                setError('');
                const gameData = await gameService.getGameById(gameId);
                setGame(gameData);

                // Check wishlist & collection status via backend API (if authenticated)
                if (isAuthenticated) {
                    try {
                        const wishCheck = await wishlistService.checkGame(gameId);
                        setIsInWishlist(wishCheck.inWishlist);
                        if (wishCheck.item) setWishlistItemId(wishCheck.item.id);
                    } catch { }

                    try {
                        const colStatus = await collectionService.getGameStatus(gameId);
                        if (colStatus.data) {
                            setCollectionStatus(colStatus.data.status || 'owned');
                            setCollectionItemId(colStatus.data.id || null);
                        }
                    } catch { }
                }
            } catch (err: any) {
                console.error('Error fetching game:', err);
                setError(err.response?.data?.message || 'Failed to load game details');
            } finally {
                setLoading(false);
            }
        };

        fetchGame();
        fetchReviews();
    }, [gameId, isAuthenticated, fetchReviews]);

    const handleWishlistToggle = async () => {
        if (!isAuthenticated) { navigate(ROUTES.LOGIN); return; }

        setWishlistLoading(true);
        try {
            if (isInWishlist && wishlistItemId) {
                await wishlistService.removeFromWishlist(wishlistItemId);
                setIsInWishlist(false);
                setWishlistItemId(null);
            } else {
                const response = await wishlistService.addToWishlist({ game_id: gameId });
                setIsInWishlist(true);
                setWishlistItemId(response.data?.id || null);
            }
        } catch (err: any) {
            console.error('Wishlist toggle failed:', err);
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleCollectionToggle = async (status: string) => {
        if (!isAuthenticated) { navigate(ROUTES.LOGIN); return; }

        setCollectionLoading(true);
        try {
            if (collectionStatus === status && collectionItemId) {
                // Remove from collection
                await collectionService.removeFromCollection(collectionItemId);
                setCollectionStatus(null);
                setCollectionItemId(null);
            } else if (collectionItemId) {
                // Update status
                await collectionService.updateItem(collectionItemId, { status });
                setCollectionStatus(status);
            } else {
                // Add to collection
                const response = await collectionService.addToCollection({ game_id: gameId, platform_id: 1, status });
                setCollectionStatus(status);
                setCollectionItemId(response.data?.id || null);
            }
        } catch (err: any) {
            console.error('Collection toggle failed:', err);
        } finally {
            setCollectionLoading(false);
        }
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.target as HTMLImageElement;
        target.src = PLACEHOLDER_IMAGE;
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'TBA';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) return <Loading />;

    if (error) {
        return (
            <div className="max-w-4xl mx-auto">
                <ErrorMessage message={error} onRetry={() => window.location.reload()} />
                <div className="mt-4 text-center">
                    <Link to={ROUTES.GAMES}>
                        <Button variant="secondary">← Back to Games</Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (!game) {
        return (
            <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-white mb-4">Game not found</h1>
                <Link to={ROUTES.GAMES}>
                    <Button>← Back to Games</Button>
                </Link>
            </div>
        );
    }

    return (
        <motion.div
            className="max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Back button */}
            <motion.div variants={itemVariants} className="mb-6">
                <Link to={ROUTES.GAMES} className="text-primary-400 hover:text-primary-300 flex items-center gap-2 transition-colors">
                    ← Back to Games
                </Link>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Cover Image */}
                <motion.div variants={itemVariants} className="lg:col-span-1">
                    <div className="glass-card p-0 overflow-hidden">
                        <div className="relative">
                            <img
                                src={game.cover_url || PLACEHOLDER_IMAGE}
                                alt={game.title}
                                className="w-full h-auto object-cover"
                                onError={handleImageError}
                            />
                            {game.metacritic_score && (
                                <div className={`absolute top-4 right-4 px-3 py-2 rounded-lg text-white text-xl font-bold backdrop-blur-sm ${game.metacritic_score >= 90 ? 'bg-green-500/80' :
                                    game.metacritic_score >= 75 ? 'bg-yellow-500/80' :
                                        game.metacritic_score >= 50 ? 'bg-orange-500/80' : 'bg-red-500/80'
                                    }`}>
                                    {game.metacritic_score}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-400 via-transparent to-transparent opacity-60" />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 space-y-3">
                        <Button
                            onClick={handleWishlistToggle}
                            disabled={wishlistLoading}
                            variant={isInWishlist ? 'secondary' : 'primary'}
                            className="w-full"
                        >
                            {wishlistLoading ? 'Loading...' : isInWishlist ? '✓ In Wishlist' : '⭐ Add to Wishlist'}
                        </Button>

                        <Button
                            onClick={() => handleCollectionToggle('playing')}
                            disabled={collectionLoading}
                            variant={collectionStatus === 'playing' ? 'secondary' : 'primary'}
                            className="w-full"
                        >
                            {collectionLoading ? 'Loading...' : collectionStatus === 'playing' ? '✓ Playing Now' : '🎯 Mark as Playing'}
                        </Button>

                        <Button
                            onClick={() => handleCollectionToggle('completed')}
                            disabled={collectionLoading}
                            variant={collectionStatus === 'completed' ? 'secondary' : 'primary'}
                            className="w-full"
                        >
                            {collectionLoading ? 'Loading...' : collectionStatus === 'completed' ? '✓ Completed' : '✅ Mark as Completed'}
                        </Button>

                        {!collectionStatus && (
                            <Button
                                onClick={() => handleCollectionToggle('owned')}
                                disabled={collectionLoading}
                                variant="ghost"
                                className="w-full"
                            >
                                📚 Add to Collection
                            </Button>
                        )}

                        {game.trailer_url && (
                            <a href={game.trailer_url} target="_blank" rel="noopener noreferrer" className="block">
                                <Button variant="secondary" className="w-full">
                                    🎬 Watch Trailer
                                </Button>
                            </a>
                        )}
                    </div>
                </motion.div>

                {/* Right Column - Game Info */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <div className="glass-card p-6">
                        {/* Title and Badges */}
                        <div className="mb-6">
                            <h1 className="text-4xl font-bold text-white mb-4">{game.title}</h1>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-lg text-sm font-medium">
                                    {RELEASE_STATUS_LABELS[game.release_status]}
                                </span>
                                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${game.availability_status === 'available'
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                    {AVAILABILITY_STATUS_LABELS[game.availability_status]}
                                </span>
                                {game.age_rating && (
                                    <span className="px-3 py-1 bg-dark-300 text-gray-400 rounded-lg text-sm font-medium">
                                        {game.age_rating}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Synopsis */}
                        {game.synopsis && (
                            <div className="mb-6">
                                <p className="text-xl text-gray-300 italic">{game.synopsis}</p>
                            </div>
                        )}

                        {/* Description */}
                        {game.description && (
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold mb-2 text-white">About</h2>
                                <p className="text-gray-400 leading-relaxed">{game.description}</p>
                            </div>
                        )}

                        {/* Game Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase">Release Date</h3>
                                    <p className="text-lg text-white">
                                        {formatDate(game.release_date)}
                                        {game.release_year && !game.release_date && ` (${game.release_year})`}
                                    </p>
                                </div>

                                {game.average_rating !== undefined && game.average_rating > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 uppercase">User Rating</h3>
                                        <p className="text-lg text-white">
                                            ⭐ {game.average_rating.toFixed(1)} / 5
                                            <span className="text-sm text-gray-500 ml-2">
                                                ({game.total_reviews} {game.total_reviews === 1 ? 'review' : 'reviews'})
                                            </span>
                                        </p>
                                    </div>
                                )}

                                {game.metacritic_score && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 uppercase">Metacritic Score</h3>
                                        <p className="text-lg">
                                            <span className={`inline-block px-2 py-1 rounded-lg text-white font-bold ${game.metacritic_score >= 90 ? 'bg-green-500/80' :
                                                game.metacritic_score >= 75 ? 'bg-yellow-500/80' :
                                                    game.metacritic_score >= 50 ? 'bg-orange-500/80' : 'bg-red-500/80'
                                                }`}>
                                                {game.metacritic_score}
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                {game.age_rating && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 uppercase">Age Rating</h3>
                                        <p className="text-lg text-white">{game.age_rating}</p>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase">Status</h3>
                                    <p className="text-lg text-white">
                                        {RELEASE_STATUS_LABELS[game.release_status]}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase">Availability</h3>
                                    <p className="text-lg text-white">
                                        {AVAILABILITY_STATUS_LABELS[game.availability_status]}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        {(game.is_early_access || game.was_rereleased) && (
                            <div className="border-t border-dark-300 pt-4">
                                <div className="flex flex-wrap gap-3">
                                    {game.is_early_access && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-400">
                                            🎮 Early Access
                                        </span>
                                    )}
                                    {game.was_rereleased && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400">
                                            🔄 Re-released
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Additional Cards */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.div
                            className="stat-card text-center"
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="text-4xl mb-2">📅</div>
                            <h3 className="font-semibold text-gray-400">Release Year</h3>
                            <p className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-accent-pink bg-clip-text text-transparent">
                                {game.release_year || 'TBA'}
                            </p>
                        </motion.div>

                        <motion.div
                            className="stat-card text-center"
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="text-4xl mb-2">📊</div>
                            <h3 className="font-semibold text-gray-400">Reviews</h3>
                            <p className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-accent-pink bg-clip-text text-transparent">
                                {game.total_reviews || 0}
                            </p>
                        </motion.div>
                    </div>
                </motion.div>
            </div>

            {/* Reviews Section */}
            <motion.div variants={itemVariants} className="mt-8">
                <ReviewsList
                    gameId={gameId}
                    reviews={reviews}
                    onReviewAdded={fetchReviews}
                    loading={reviewsLoading}
                />
            </motion.div>
        </motion.div>
    );
};
