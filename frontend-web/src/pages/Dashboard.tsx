import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useUserStats } from '../hooks/useUserStats';
import { gameService } from '../services/gameService';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { ROUTES } from '../utils/constants';
import { Game } from '../types/game.types';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { stats: userStats, loading: statsLoading } = useUserStats();
    const [recentGames, setRecentGames] = useState<Game[]>([]);
    const [catalogTotal, setCatalogTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                const response = await gameService.getAllGames({ page: 1, limit: 6 });
                setRecentGames(response.data?.games || []);
                setCatalogTotal(response.data?.pagination.total || 0);
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    if (loading || statsLoading) return <Loading />;

    const statCards = [
        { icon: '📚', value: userStats.collection || catalogTotal, label: userStats.collection > 0 ? 'My Collection' : 'Total Games in Catalog', color: 'from-purple-500 to-pink-500' },
        { icon: '🎯', value: userStats.playing, label: 'Currently Playing', color: 'from-blue-500 to-cyan-500' },
        { icon: '✅', value: userStats.completed, label: 'Completed', color: 'from-green-500 to-emerald-500' },
        { icon: '⭐', value: userStats.wishlist, label: 'Wishlist', color: 'from-yellow-500 to-orange-500' },
    ];

    return (
        <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Welcome Section */}
            <motion.div
                variants={itemVariants}
                className="glass-card p-8 relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-pink/20" />
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold mb-2 gradient-text">
                        Welcome back, {user?.name || 'Gamer'}! 🎮
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Ready to explore your game collection?
                    </p>
                </div>
                <div className="absolute -right-10 -bottom-10 text-[150px] opacity-10">
                    🎮
                </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        className="stat-card text-center relative overflow-hidden group"
                        whileHover={{ scale: 1.02, y: -5 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                        <div className="text-4xl mb-3">{stat.icon}</div>
                        <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                            {stat.value}
                        </div>
                        <div className="text-gray-400 mt-1">{stat.label}</div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants} className="glass-card p-6">
                <h2 className="text-2xl font-bold mb-6 text-white">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link to={ROUTES.GAMES}>
                        <motion.div
                            className="glass p-4 rounded-xl flex items-center gap-4 cursor-pointer group"
                            whileHover={{ scale: 1.02, x: 5 }}
                        >
                            <span className="text-3xl">🔍</span>
                            <div>
                                <div className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                                    Browse Games
                                </div>
                                <div className="text-sm text-gray-500">Explore the catalog</div>
                            </div>
                        </motion.div>
                    </Link>
                    <Link to={ROUTES.COLLECTION}>
                        <motion.div
                            className="glass p-4 rounded-xl flex items-center gap-4 cursor-pointer group"
                            whileHover={{ scale: 1.02, x: 5 }}
                        >
                            <span className="text-3xl">📖</span>
                            <div>
                                <div className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                                    My Collection
                                </div>
                                <div className="text-sm text-gray-500">View your games</div>
                            </div>
                        </motion.div>
                    </Link>
                    <Link to={ROUTES.WISHLIST}>
                        <motion.div
                            className="glass p-4 rounded-xl flex items-center gap-4 cursor-pointer group"
                            whileHover={{ scale: 1.02, x: 5 }}
                        >
                            <span className="text-3xl">⭐</span>
                            <div>
                                <div className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                                    Wishlist
                                </div>
                                <div className="text-sm text-gray-500">Games you want</div>
                            </div>
                        </motion.div>
                    </Link>
                </div>
            </motion.div>

            {/* Recent Games */}
            <motion.div variants={itemVariants}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Recent Games in Catalog</h2>
                    <Link to={ROUTES.GAMES}>
                        <Button variant="secondary" size="sm">View All →</Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentGames.map((game, index) => (
                        <motion.div
                            key={game.id}
                            className="game-card group"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -5 }}
                        >
                            <div className="aspect-video bg-gradient-to-br from-dark-300 to-dark-400 rounded-lg mb-4 flex items-center justify-center">
                                <span className="text-6xl opacity-50">🎮</span>
                            </div>
                            <h3 className="font-bold text-lg mb-2 text-white group-hover:text-primary-400 transition-colors line-clamp-1">
                                {game.title}
                            </h3>
                            <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                                {game.description || 'No description available'}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {game.release_status && (
                                    <span className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-lg">
                                        {game.release_status}
                                    </span>
                                )}
                                {game.release_year && (
                                    <span className="px-2 py-1 bg-dark-300 text-gray-400 text-xs rounded-lg">
                                        {game.release_year}
                                    </span>
                                )}
                            </div>
                            <Link to={`${ROUTES.GAMES}/${game.id}`}>
                                <Button size="sm" className="w-full">View Details</Button>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {recentGames.length === 0 && (
                    <motion.div
                        className="glass-card text-center py-16"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="text-6xl mb-4">🎮</div>
                        <p className="text-gray-400 text-lg mb-4">No games available yet</p>
                        <Link to={ROUTES.GAMES}>
                            <Button>Browse Catalog</Button>
                        </Link>
                    </motion.div>
                )}
            </motion.div>

            {/* Activity Feed */}
            <motion.div variants={itemVariants} className="glass-card p-6">
                <h2 className="text-2xl font-bold mb-6 text-white">Recent Activity</h2>
                <div className="text-center py-12">
                    <div className="text-5xl mb-4 opacity-50">📋</div>
                    <p className="text-gray-400">No recent activity</p>
                    <p className="text-sm text-gray-500 mt-2">Start adding games to your collection!</p>
                </div>
            </motion.div>
        </motion.div>
    );
};
