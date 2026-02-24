import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collectionService, CollectionItem, CollectionStats as CollectionStatsType } from '../services/collectionService';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { Pagination } from '../components/common/Pagination';
import { CollectionStats } from '../components/games/CollectionStats';
import { ROUTES } from '../utils/constants';

const STATUS_FILTERS = [
    { value: '', label: 'All Games', icon: '📚' },
    { value: 'playing', label: 'Playing', icon: '🎮' },
    { value: 'completed', label: 'Completed', icon: '✅' },
    { value: 'owned', label: 'Owned', icon: '📦' },
    { value: 'backlog', label: 'Backlog', icon: '📋' },
    { value: 'dropped', label: 'Dropped', icon: '⛔' },
];

export const Collection: React.FC = () => {
    const [items, setItems] = useState<CollectionItem[]>([]);
    const [stats, setStats] = useState<CollectionStatsType | null>(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeFilter, setActiveFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const fetchCollection = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const params: Record<string, any> = { page, limit: 20 };
            if (activeFilter) params.status = activeFilter;

            const response = await collectionService.getCollection(params);
            const data = response.data || response;
            setItems(data.items || data.collection || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotalItems(data.pagination?.total || 0);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load collection');
        } finally {
            setLoading(false);
        }
    }, [page, activeFilter]);

    const fetchStats = useCallback(async () => {
        try {
            setStatsLoading(true);
            const data = await collectionService.getStats();
            setStats(data);
        } catch {
            // Stats are non-critical
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCollection();
    }, [fetchCollection]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleRemove = async (itemId: number) => {
        try {
            await collectionService.removeFromCollection(itemId);
            fetchCollection();
            fetchStats();
        } catch {
            // Silently ignore
        }
    };

    const handleFilterChange = (status: string) => {
        setActiveFilter(status);
        setPage(1);
    };

    if (loading && items.length === 0 && !error) return <Loading />;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-4xl font-extrabold gradient-text mb-2">My Collection</h1>
                <p className="text-gray-400">
                    {totalItems > 0 ? `${totalItems} games in your collection` : 'Your personal game library'}
                </p>
            </motion.div>

            {/* Collection Stats */}
            <CollectionStats stats={stats} loading={statsLoading} />

            {/* Status Filters */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-2 flex-wrap"
            >
                {STATUS_FILTERS.map((filter) => (
                    <motion.button
                        key={filter.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleFilterChange(filter.value)}
                        className={`filter-btn flex items-center gap-1.5 ${activeFilter === filter.value ? 'active' : ''}`}
                    >
                        <span>{filter.icon}</span>
                        <span>{filter.label}</span>
                    </motion.button>
                ))}
            </motion.div>

            {error && <ErrorMessage message={error} onRetry={fetchCollection} />}

            {/* Collection Grid */}
            {items.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((item, index) => {
                            const game = item.Game;
                            if (!game) return null;

                            const statusColors: Record<string, string> = {
                                playing: 'bg-green-500/80',
                                completed: 'bg-purple-500/80',
                                owned: 'bg-blue-500/80',
                                backlog: 'bg-yellow-500/80',
                                dropped: 'bg-red-500/80',
                            };

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                >
                                    <Link to={`${ROUTES.GAMES}/${game.id}`}>
                                        <motion.div
                                            whileHover={{ y: -8, borderColor: 'rgba(167, 139, 250, 1)' }}
                                            className="game-card h-full"
                                        >
                                            <div className="relative h-48 overflow-hidden">
                                                {game.cover_url ? (
                                                    <img
                                                        src={game.cover_url}
                                                        alt={game.title}
                                                        className="w-full h-full object-cover transition-transform duration-300"
                                                        loading="lazy"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = `https://placehold.co/300x400/1f2937/a78bfa?text=${encodeURIComponent(game.title.substring(0, 15))}`;
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-600/30 to-accent-pink/30 text-white text-center p-4">
                                                        <span className="text-lg font-semibold">{game.title}</span>
                                                    </div>
                                                )}
                                                <div className="absolute top-2 left-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold backdrop-blur-sm text-white capitalize ${statusColors[item.status] || 'bg-gray-500/80'}`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                                {item.rating && (
                                                    <div className="absolute top-2 right-2">
                                                        <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-500/80 backdrop-blur-sm text-white">
                                                            ⭐ {item.rating}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-white mb-1 line-clamp-1">{game.title}</h3>
                                                <div className="flex items-center justify-between text-sm text-gray-400">
                                                    {item.Platform && <span>{item.Platform.name}</span>}
                                                    {item.format && <span className="capitalize">{item.format}</span>}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </Link>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => { e.preventDefault(); handleRemove(item.id); }}
                                        className="mt-1 w-full text-xs text-red-400 hover:text-red-300 transition-colors py-1"
                                    >
                                        Remove from collection
                                    </motion.button>
                                </motion.div>
                            );
                        })}
                    </div>

                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
                </>
            ) : !loading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card text-center py-16 rounded-2xl">
                    <span className="text-6xl mb-4 block">📚</span>
                    <h3 className="text-2xl font-bold mb-2 text-white">
                        {activeFilter ? 'No games with this status' : 'Your collection is empty'}
                    </h3>
                    <p className="text-gray-400 mb-6">
                        {activeFilter ? 'Try a different filter' : 'Start adding games to your collection!'}
                    </p>
                    {!activeFilter && (
                        <Link to={ROUTES.GAMES}>
                            <Button>Browse Games</Button>
                        </Link>
                    )}
                </motion.div>
            ) : null}
        </div>
    );
};
