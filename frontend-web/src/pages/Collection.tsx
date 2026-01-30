import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { gameService } from '../services/gameService';
import { Game } from '../types/game.types';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { ROUTES } from '../utils/constants';

const stats = [
    { icon: '⭐', value: '8', label: 'Currently Playing', color: 'text-green-400' },
    { icon: '✅', value: '64', label: 'Completed', color: 'text-blue-400' },
    { icon: '❤️', value: '34', label: 'Wishlist', color: 'text-pink-400' },
    { icon: '🏆', value: '12', label: 'GOTY Owned', color: 'text-yellow-400' },
];

const filters = ['All Games', 'Playing', 'Completed', 'Backlog'];

export const Collection: React.FC = () => {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All Games');

    const fetchCollection = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await gameService.getAllGames({ page: 1, limit: 50 });
            setGames(response.data?.games || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load collection');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollection();
    }, []);

    const filteredGames = games.filter((game) =>
        game.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <Loading />;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-4xl font-extrabold gradient-text mb-2">My Collection</h1>
                <p className="text-gray-400">{filteredGames.length} games across all platforms</p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        whileHover={{ y: -5, borderColor: 'rgba(167, 139, 250, 1)' }}
                        className="stat-card"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center">
                                <span className="text-xl">{stat.icon}</span>
                            </div>
                        </div>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-sm text-gray-400">{stat.label}</p>
                    </motion.div>
                ))}
            </motion.div>

            {/* Search and Filters */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
            >
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search your collection..."
                        className="input pl-12"
                    />
                </div>

                <div className="flex gap-2 flex-wrap">
                    {filters.map((filter) => (
                        <motion.button
                            key={filter}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveFilter(filter)}
                            className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                        >
                            {filter}
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {error && <ErrorMessage message={error} onRetry={fetchCollection} />}

            {/* Games Grid */}
            {filteredGames.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredGames.map((game, index) => (
                        <motion.div
                            key={game.id}
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
                                            <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/80 backdrop-blur-sm text-white">
                                                Playing
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-white mb-1 line-clamp-1">{game.title}</h3>
                                        <p className="text-sm text-gray-400 line-clamp-2">
                                            {game.description || 'No description'}
                                        </p>
                                    </div>
                                </motion.div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card text-center py-16 rounded-2xl"
                >
                    <span className="text-6xl mb-4 block">📚</span>
                    <h3 className="text-2xl font-bold mb-2 text-white">
                        {searchQuery ? 'No games found' : 'Your collection is empty'}
                    </h3>
                    <p className="text-gray-400 mb-6">
                        {searchQuery ? 'Try a different search' : 'Start adding games to your collection!'}
                    </p>
                    {!searchQuery && (
                        <Link to={ROUTES.GAMES}>
                            <Button>Browse Games</Button>
                        </Link>
                    )}
                </motion.div>
            )}
        </div>
    );
};
