import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { gameService } from '../services/gameService';
import { Game } from '../types/game.types';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { ROUTES, RELEASE_STATUS_LABELS } from '../utils/constants';

const PLACEHOLDER_IMAGE = 'https://placehold.co/300x400/1a1a2e/a78bfa?text=No+Cover';

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

export const CompletedGames: React.FC = () => {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [completedIds, setCompletedIds] = useState<number[]>([]);

    const fetchCompletedGames = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const storedCompleted = JSON.parse(localStorage.getItem('completed') || '[]');
            setCompletedIds(storedCompleted);

            if (storedCompleted.length === 0) {
                setGames([]);
                setLoading(false);
                return;
            }

            const response = await gameService.getAllGames({ page: 1, limit: 200 });
            const allGames = response.data?.games || [];
            const completedGames = allGames.filter((game: Game) => storedCompleted.includes(game.id));
            setGames(completedGames);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load completed games');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCompletedGames();
    }, [fetchCompletedGames]);

    const removeFromCompleted = (gameId: number) => {
        const newCompleted = completedIds.filter(id => id !== gameId);
        localStorage.setItem('completed', JSON.stringify(newCompleted));

        // Also update the detailed list
        try {
            const detailed = JSON.parse(localStorage.getItem('gamevault_completed') || '[]');
            const newDetailed = detailed.filter((item: any) => item.id !== gameId);
            localStorage.setItem('gamevault_completed', JSON.stringify(newDetailed));
        } catch { }

        setCompletedIds(newCompleted);
        setGames(games.filter(game => game.id !== gameId));
        window.dispatchEvent(new Event('completed-updated'));
    };

    const clearCompleted = () => {
        if (window.confirm('Are you sure you want to clear your entire Completed list?')) {
            localStorage.setItem('completed', JSON.stringify([]));
            localStorage.setItem('gamevault_completed', JSON.stringify([]));
            setCompletedIds([]);
            setGames([]);
            window.dispatchEvent(new Event('completed-updated'));
        }
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.target as HTMLImageElement;
        target.src = PLACEHOLDER_IMAGE;
    };

    const filteredGames = games.filter((game) =>
        game.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <Loading />;

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div
                variants={itemVariants}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
                <div>
                    <h1 className="text-4xl font-bold mb-2 gradient-text">✅ Completed Games</h1>
                    <p className="text-gray-400">
                        {games.length} {games.length === 1 ? 'game' : 'games'} completed
                    </p>
                </div>
                {games.length > 0 && (
                    <Button variant="secondary" onClick={clearCompleted}>
                        🗑️ Clear List
                    </Button>
                )}
            </motion.div>

            {games.length > 0 && (
                <motion.div variants={itemVariants}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search completed games..."
                        className="w-full px-4 py-3 bg-dark-300 border border-dark-100 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                </motion.div>
            )}

            {error && <ErrorMessage message={error} onRetry={fetchCompletedGames} />}

            {filteredGames.length > 0 ? (
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    variants={containerVariants}
                >
                    {filteredGames.map((game) => (
                        <motion.div
                            key={game.id}
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
                                        <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/80 backdrop-blur-sm text-white">
                                            ✅ Completed
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
                                            ? new Date(game.release_date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short'
                                            })
                                            : game.release_year || 'TBA'}
                                    </span>
                                    {game.average_rating && game.average_rating > 0 && (
                                        <span className="flex items-center text-yellow-400">
                                            ⭐ {game.average_rating.toFixed(1)}
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
                                            removeFromCompleted(game.id);
                                        }}
                                    >
                                        ✕
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <motion.div
                    className="glass-card text-center py-16"
                    variants={itemVariants}
                >
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-2xl font-bold mb-2 text-white">
                        {searchQuery ? 'No games found' : 'No completed games yet'}
                    </h3>
                    <p className="text-gray-400 mb-6">
                        {searchQuery
                            ? 'Try a different search term'
                            : 'Browse the catalog and mark games you\'ve completed!'}
                    </p>
                    {!searchQuery && (
                        <Link to={ROUTES.GAMES}>
                            <Button size="lg">🎮 Browse Games</Button>
                        </Link>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
};
