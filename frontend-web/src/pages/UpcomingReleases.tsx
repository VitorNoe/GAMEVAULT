import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { gameService, UpcomingGameWithCountdown } from '../services/gameService';
import { wishlistService } from '../services/wishlistService';
import { useAuth } from '../hooks/useAuth';
import { Pagination } from '../components/common/Pagination';
import { RELEASE_STATUS_LABELS } from '../utils/constants';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const getCountdownColor = (days: number): string => {
    if (days <= 7) return 'text-red-400';
    if (days <= 30) return 'text-orange-400';
    if (days <= 90) return 'text-yellow-400';
    return 'text-blue-400';
};

const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
        coming_soon: 'bg-green-500/20 text-green-400 border-green-500/30',
        in_development: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        early_access: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        open_beta: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        closed_beta: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
        alpha: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
};

export const UpcomingReleases: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [games, setGames] = useState<UpcomingGameWithCountdown[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Wishlist toast/state
    const [wishlistAdding, setWishlistAdding] = useState<number | null>(null);
    const [wishlistNotice, setWishlistNotice] = useState<string | null>(null);

    const fetchGames = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await gameService.getUpcomingCountdown({ page, limit: 24 });
            const data = response.data || response;
            setGames((data as any).games || []);
            setTotalPages((data as any).pagination?.totalPages || 1);
            setTotal((data as any).pagination?.total || 0);
        } catch (err: any) {
            console.error('Failed to load upcoming releases:', err);
            setError('Failed to load upcoming releases.');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchGames(); }, [fetchGames]);

    // Handle add to wishlist with notification
    const handleAddToWishlist = async (gameId: number, gameTitle: string) => {
        if (!isAuthenticated) return;
        setWishlistAdding(gameId);
        try {
            const check = await wishlistService.checkGame(gameId);
            if (check.inWishlist) {
                setWishlistNotice(`"${gameTitle}" is already on your wishlist!`);
            } else {
                await wishlistService.addToWishlist({ game_id: gameId, priority: 'high' });
                setWishlistNotice(`"${gameTitle}" added to wishlist! You'll be notified on release.`);
            }
            setTimeout(() => setWishlistNotice(null), 3500);
        } catch (err) {
            console.error('Wishlist add failed:', err);
            setWishlistNotice('Failed to add to wishlist.');
            setTimeout(() => setWishlistNotice(null), 3000);
        } finally {
            setWishlistAdding(null);
        }
    };

    // Stats
    const comingSoon = games.filter(g => g.release_status === 'coming_soon').length;
    const inDev = games.filter(g => g.release_status === 'in_development').length;
    const within30days = games.filter(g => g.countdown && g.countdown.days_until_release <= 30 && g.countdown.days_until_release > 0).length;

    return (
        <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
            {/* Toast notification */}
            <AnimatePresence>
                {wishlistNotice && (
                    <motion.div
                        initial={{ opacity: 0, y: -40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -40 }}
                        className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl bg-green-500/90 backdrop-blur-sm text-white font-medium shadow-xl max-w-sm"
                    >
                        {wishlistNotice}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold gradient-text mb-2">📅 Upcoming Releases</h1>
                    <p className="text-gray-400 text-lg">
                        Track release dates, countdowns, and add upcoming games to your wishlist
                    </p>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">🎮</div>
                    <p className="text-2xl font-bold text-primary-400">{total}</p>
                    <p className="text-sm text-gray-400">Upcoming Games</p>
                </motion.div>
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">🔜</div>
                    <p className="text-2xl font-bold text-green-400">{comingSoon}</p>
                    <p className="text-sm text-gray-400">Coming Soon</p>
                </motion.div>
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">🛠️</div>
                    <p className="text-2xl font-bold text-blue-400">{inDev}</p>
                    <p className="text-sm text-gray-400">In Development</p>
                </motion.div>
                <motion.div className="stat-card text-center" whileHover={{ y: -5 }}>
                    <div className="text-3xl mb-2">⏰</div>
                    <p className="text-2xl font-bold text-red-400">{within30days}</p>
                    <p className="text-sm text-gray-400">Within 30 Days</p>
                </motion.div>
            </motion.div>

            {/* Loading */}
            {loading && (
                <div className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="glass-card p-4 animate-pulse flex items-center gap-4">
                            <div className="w-28 h-36 bg-white/5 rounded-lg flex-shrink-0" />
                            <div className="flex-1 space-y-3">
                                <div className="h-6 bg-white/5 rounded w-1/3" />
                                <div className="h-4 bg-white/5 rounded w-1/4" />
                                <div className="h-4 bg-white/5 rounded w-full" />
                            </div>
                            <div className="w-24 h-20 bg-white/5 rounded-lg flex-shrink-0" />
                        </div>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && !loading && (
                <motion.div variants={itemVariants} className="glass-card text-center py-12">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h3 className="text-xl font-bold text-white mb-2">{error}</h3>
                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={fetchGames}
                        className="mt-4 px-6 py-2 rounded-lg bg-primary-500 text-white font-medium"
                    >
                        Retry
                    </motion.button>
                </motion.div>
            )}

            {/* Content */}
            {!loading && !error && games.length > 0 && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        {games.map((game) => (
                            <motion.div
                                key={game.id}
                                className="game-card group overflow-hidden"
                                variants={itemVariants}
                                whileHover={{ y: -5, borderColor: 'rgba(167, 139, 250, 0.6)' }}
                            >
                                <Link to={`/games/${game.id}`}>
                                    <div className="relative h-48 bg-dark-300 overflow-hidden mb-4 rounded-lg">
                                        <img
                                            src={game.cover_url || `https://placehold.co/300x400/1a1a2e/a78bfa?text=${encodeURIComponent(game.title.substring(0, 15))}`}
                                            alt={game.title}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = `https://placehold.co/300x400/1a1a2e/a78bfa?text=${encodeURIComponent(game.title.substring(0, 15))}`;
                                            }}
                                        />
                                        <div className="absolute top-2 left-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusBadge(game.release_status)}`}>
                                                {RELEASE_STATUS_LABELS[game.release_status] || game.release_status}
                                            </span>
                                        </div>
                                        {game.countdown && !game.countdown.is_released && (
                                            <div className="absolute bottom-2 right-2">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${getCountdownColor(game.countdown.days_until_release)} bg-black/70 backdrop-blur-sm`}>
                                                    ⏰ {game.countdown.days_until_release}d
                                                </span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-dark-400 via-transparent to-transparent opacity-60" />
                                    </div>
                                </Link>
                                <div>
                                    <Link to={`/games/${game.id}`}>
                                        <h3 className="font-bold text-lg mb-1 text-white group-hover:text-primary-400 transition-colors line-clamp-1">
                                            {game.title}
                                        </h3>
                                    </Link>
                                    {game.developer && (
                                        <p className="text-sm text-primary-400 font-medium mb-1">{game.developer.name}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mb-2">
                                        📅 {game.release_date
                                            ? new Date(game.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                            : 'TBA'}
                                        {game.countdown && !game.countdown.is_released && (
                                            <span className={`ml-2 ${getCountdownColor(game.countdown.days_until_release)}`}>
                                                ({game.countdown.countdown_label})
                                            </span>
                                        )}
                                    </p>
                                    {game.platforms && game.platforms.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {game.platforms.slice(0, 3).map((p) => (
                                                <span key={p.id} className="px-1.5 py-0.5 bg-dark-300 text-gray-300 text-xs rounded">
                                                    {p.name}
                                                </span>
                                            ))}
                                            {game.platforms.length > 3 && (
                                                <span className="px-1.5 py-0.5 text-gray-500 text-xs">+{game.platforms.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                    {isAuthenticated && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={(e) => { e.preventDefault(); handleAddToWishlist(game.id, game.title); }}
                                            disabled={wishlistAdding === game.id}
                                            className="w-full mt-2 px-3 py-1.5 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 text-xs font-medium transition-colors disabled:opacity-50"
                                        >
                                            {wishlistAdding === game.id ? '...' : '💜 Add to Wishlist'}
                                        </motion.button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            )}

            {/* Empty */}
            {!loading && !error && games.length === 0 && (
                <motion.div className="glass-card text-center py-16" variants={itemVariants}>
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-2xl font-bold mb-2 text-white">No upcoming releases found</h3>
                    <p className="text-gray-400">Check back later for new announcements</p>
                </motion.div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            )}

            {/* Wishlist CTA */}
            <motion.div
                variants={itemVariants}
                className="glass-card p-8 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
                    border: '2px solid rgba(168, 85, 247, 0.2)',
                }}
            >
                <div className="absolute -right-10 -bottom-10 text-[120px] opacity-10">🔔</div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-extrabold text-white mb-3">🔔 Never Miss a Release</h3>
                    <p className="text-gray-400 leading-relaxed max-w-3xl">
                        Add upcoming games to your wishlist and get notified when they launch.
                        Track release dates, countdowns, and be the first to know when your most anticipated
                        games become available.
                    </p>
                    {!isAuthenticated && (
                        <Link
                            to="/login"
                            className="inline-block mt-4 px-6 py-2 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
                        >
                            Log in to enable notifications
                        </Link>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};
