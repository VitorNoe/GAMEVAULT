import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { gameService } from '../services/gameService';
import { Game } from '../types/game.types';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
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
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [isPlayingNow, setIsPlayingNow] = useState(false);
    const [isCompletedGame, setIsCompletedGame] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    useEffect(() => {
        const fetchGame = async () => {
            if (!id) return;

            try {
                setLoading(true);
                setError('');
                const gameData = await gameService.getGameById(parseInt(id));
                setGame(gameData);

                // Check if game is in wishlist (from localStorage)
                const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
                setIsInWishlist(wishlist.includes(parseInt(id)));

                // Check if game is in playing now (from localStorage)
                const playing = JSON.parse(localStorage.getItem('playing_now') || '[]');
                setIsPlayingNow(playing.includes(parseInt(id)));

                // Check if game is in completed (from localStorage)
                const completed = JSON.parse(localStorage.getItem('completed') || '[]');
                setIsCompletedGame(completed.includes(parseInt(id)));
            } catch (err: any) {
                console.error('Error fetching game:', err);
                setError(err.response?.data?.message || 'Failed to load game details');
            } finally {
                setLoading(false);
            }
        };

        fetchGame();
    }, [id]);

    const handleWishlistToggle = () => {
        if (!isAuthenticated) {
            navigate(ROUTES.LOGIN);
            return;
        }

        setWishlistLoading(true);
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');

        if (isInWishlist) {
            // Remove from wishlist
            const newWishlist = wishlist.filter((gameId: number) => gameId !== parseInt(id!));
            localStorage.setItem('wishlist', JSON.stringify(newWishlist));
            setIsInWishlist(false);
        } else {
            // Add to wishlist
            wishlist.push(parseInt(id!));
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
            setIsInWishlist(true);
        }

        // Dispatch event to update stats in sidebar
        window.dispatchEvent(new Event('wishlist-updated'));
        setWishlistLoading(false);
    };

    const handlePlayingToggle = () => {
        if (!isAuthenticated) {
            navigate(ROUTES.LOGIN);
            return;
        }

        const playing = JSON.parse(localStorage.getItem('playing_now') || '[]');
        const gameIdNum = parseInt(id!);

        if (isPlayingNow) {
            // Remove from playing
            const newPlaying = playing.filter((gId: number) => gId !== gameIdNum);
            localStorage.setItem('playing_now', JSON.stringify(newPlaying));
            // Also update detailed list
            try {
                const detailed = JSON.parse(localStorage.getItem('gamevault_playing_now') || '[]');
                localStorage.setItem('gamevault_playing_now', JSON.stringify(detailed.filter((item: any) => item.id !== gameIdNum)));
            } catch { }
            setIsPlayingNow(false);
        } else {
            // Add to playing
            playing.push(gameIdNum);
            localStorage.setItem('playing_now', JSON.stringify(playing));
            // Also update detailed list
            try {
                const detailed = JSON.parse(localStorage.getItem('gamevault_playing_now') || '[]');
                detailed.push({ id: gameIdNum, title: game?.title, cover_url: game?.cover_url, addedAt: new Date().toISOString() });
                localStorage.setItem('gamevault_playing_now', JSON.stringify(detailed));
            } catch { }
            setIsPlayingNow(true);
        }
        window.dispatchEvent(new Event('playing-updated'));
    };

    const handleCompletedToggle = () => {
        if (!isAuthenticated) {
            navigate(ROUTES.LOGIN);
            return;
        }

        const completed = JSON.parse(localStorage.getItem('completed') || '[]');
        const gameIdNum = parseInt(id!);

        if (isCompletedGame) {
            // Remove from completed
            const newCompleted = completed.filter((gId: number) => gId !== gameIdNum);
            localStorage.setItem('completed', JSON.stringify(newCompleted));
            // Also update detailed list
            try {
                const detailed = JSON.parse(localStorage.getItem('gamevault_completed') || '[]');
                localStorage.setItem('gamevault_completed', JSON.stringify(detailed.filter((item: any) => item.id !== gameIdNum)));
            } catch { }
            setIsCompletedGame(false);
        } else {
            // Add to completed
            completed.push(gameIdNum);
            localStorage.setItem('completed', JSON.stringify(completed));
            // Also update detailed list
            try {
                const detailed = JSON.parse(localStorage.getItem('gamevault_completed') || '[]');
                detailed.push({ id: gameIdNum, title: game?.title, cover_url: game?.cover_url, addedAt: new Date().toISOString() });
                localStorage.setItem('gamevault_completed', JSON.stringify(detailed));
            } catch { }
            setIsCompletedGame(true);
        }
        window.dispatchEvent(new Event('completed-updated'));
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
                            onClick={handlePlayingToggle}
                            variant={isPlayingNow ? 'secondary' : 'primary'}
                            className="w-full"
                        >
                            {isPlayingNow ? '✓ Playing Now' : '🎯 Mark as Playing'}
                        </Button>

                        <Button
                            onClick={handleCompletedToggle}
                            variant={isCompletedGame ? 'secondary' : 'primary'}
                            className="w-full"
                        >
                            {isCompletedGame ? '✓ Completed' : '✅ Mark as Completed'}
                        </Button>

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
        </motion.div>
    );
};
