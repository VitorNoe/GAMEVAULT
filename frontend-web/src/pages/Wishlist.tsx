import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { wishlistService, WishlistItem } from '../services/wishlistService';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { Pagination } from '../components/common/Pagination';
import { ROUTES, RELEASE_STATUS_LABELS } from '../utils/constants';

const PLACEHOLDER_IMAGE = 'https://placehold.co/300x400/1a1a2e/a78bfa?text=No+Cover';

const PRIORITY_FILTERS = [
    { value: '', label: 'All', icon: '⭐' },
    { value: 'high', label: 'High Priority', icon: '🔴' },
    { value: 'medium', label: 'Medium', icon: '🟡' },
    { value: 'low', label: 'Low', icon: '🟢' },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export const Wishlist: React.FC = () => {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const fetchWishlist = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const params: Record<string, any> = { page, limit: 20 };
            if (priorityFilter) params.priority = priorityFilter;

            const response = await wishlistService.getWishlist(params);
            const data = response.data || response;
            setItems(data.items || data.wishlist || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotalItems(data.pagination?.total || 0);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load wishlist');
        } finally {
            setLoading(false);
        }
    }, [page, priorityFilter]);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    const removeFromWishlist = async (itemId: number) => {
        try {
            await wishlistService.removeFromWishlist(itemId);
            setItems(items.filter(item => item.id !== itemId));
            setTotalItems(prev => prev - 1);
        } catch {
            // Silently ignore
        }
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.target as HTMLImageElement;
        target.src = PLACEHOLDER_IMAGE;
    };

    if (loading && items.length === 0) return <Loading />;

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div
                variants={itemVariants}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
                <div>
                    <h1 className="text-4xl font-bold mb-2 gradient-text">⭐ My Wishlist</h1>
                    <p className="text-gray-400">
                        {totalItems} {totalItems === 1 ? 'game' : 'games'} in your wishlist
                    </p>
                </div>
            </motion.div>

            {/* Priority Filters */}
            <motion.div variants={itemVariants} className="flex gap-2 flex-wrap">
                {PRIORITY_FILTERS.map((filter) => (
                    <motion.button
                        key={filter.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setPriorityFilter(filter.value); setPage(1); }}
                        className={`filter-btn flex items-center gap-1.5 ${priorityFilter === filter.value ? 'active' : ''}`}
                    >
                        <span>{filter.icon}</span>
                        <span>{filter.label}</span>
                    </motion.button>
                ))}
            </motion.div>

            {error && <ErrorMessage message={error} onRetry={fetchWishlist} />}

            {items.length > 0 ? (
                <>
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        variants={containerVariants}
                    >
                        {items.map((item) => {
                            const game = item.Game;
                            if (!game) return null;

                            const priorityColors: Record<string, string> = {
                                high: 'bg-red-500/80',
                                medium: 'bg-yellow-500/80',
                                low: 'bg-green-500/80',
                            };

                            return (
                                <motion.div
                                    key={item.id}
                                    className="game-card group"
                                    variants={itemVariants}
                                    whileHover={{ y: -5 }}
                                >
                                    <Link to={`${ROUTES.GAMES}/${game.id}`}>
                                        <div className="relative h-48 bg-dark-300 rounded-lg overflow-hidden mb-4">
                                            <img
                                                src={game.cover_url || PLACEHOLDER_IMAGE}
                                                alt={game.title}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                loading="lazy"
                                                onError={handleImageError}
                                            />
                                            {game.metacritic_score && (
                                                <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-white text-sm font-bold backdrop-blur-sm ${game.metacritic_score >= 90 ? 'bg-green-500/80' :
                                                        game.metacritic_score >= 75 ? 'bg-yellow-500/80' :
                                                            game.metacritic_score >= 50 ? 'bg-orange-500/80' : 'bg-red-500/80'
                                                    }`}>
                                                    {game.metacritic_score}
                                                </div>
                                            )}
                                            <div className="absolute top-2 left-2">
                                                <span className={`px-2 py-1 rounded text-xs font-bold backdrop-blur-sm text-white capitalize ${priorityColors[item.priority] || 'bg-gray-500/80'}`}>
                                                    {item.priority}
                                                </span>
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-dark-400 via-transparent to-transparent opacity-60" />
                                        </div>
                                    </Link>
                                    <div>
                                        <Link to={`${ROUTES.GAMES}/${game.id}`}>
                                            <h3 className="font-bold text-lg mb-2 text-white group-hover:text-primary-400 transition-colors line-clamp-2">
                                                {game.title}
                                            </h3>
                                        </Link>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <span className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-lg">
                                                {RELEASE_STATUS_LABELS[game.release_status]}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                            <span>
                                                {game.release_date
                                                    ? new Date(game.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                                                    : game.release_year || 'TBA'}
                                            </span>
                                            {game.average_rating && game.average_rating > 0 && (
                                                <span className="flex items-center text-yellow-400">
                                                    ⭐ {Number(game.average_rating).toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Link to={`${ROUTES.GAMES}/${game.id}`} className="flex-1">
                                                <Button size="sm" className="w-full">View</Button>
                                            </Link>
                                            <motion.button
                                                className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    removeFromWishlist(item.id);
                                                }}
                                            >
                                                ✕
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
                </>
            ) : !loading ? (
                <motion.div className="glass-card text-center py-16" variants={itemVariants}>
                    <div className="text-6xl mb-4">⭐</div>
                    <h3 className="text-2xl font-bold mb-2 text-white">
                        {priorityFilter ? 'No games with this priority' : 'Your wishlist is empty'}
                    </h3>
                    <p className="text-gray-400 mb-6">
                        {priorityFilter
                            ? 'Try a different filter'
                            : 'Browse our game catalog and add games you want to play!'}
                    </p>
                    {!priorityFilter && (
                        <Link to={ROUTES.GAMES}>
                            <Button size="lg">🎮 Browse Games</Button>
                        </Link>
                    )}
                </motion.div>
            ) : null}
        </motion.div>
    );
};
