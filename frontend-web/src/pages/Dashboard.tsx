import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { gameService } from '../services/gameService';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { ROUTES } from '../utils/constants';
import { Game } from '../types/game.types';

interface DashboardStats {
    totalGames: number;
    gamesPlaying: number;
    gamesCompleted: number;
    gamesWishlist: number;
}

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalGames: 0,
        gamesPlaying: 0,
        gamesCompleted: 0,
        gamesWishlist: 0,
    });
    const [recentGames, setRecentGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                // Buscar jogos recentes
                const response = await gameService.getAllGames({ page: 1, limit: 6 });
                setRecentGames(response.data?.games || []);

                // Simular estatísticas (posteriormente virá do backend)
                setStats({
                    totalGames: response.data?.pagination.total || 0,
                    gamesPlaying: 0,
                    gamesCompleted: 0,
                    gamesWishlist: 0,
                });
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    if (loading) return <Loading />;

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
                <h1 className="text-4xl font-bold mb-2">
                    Welcome back, {user?.name || 'Gamer'}! 🎮
                </h1>
                <p className="text-blue-100 text-lg">
                    Ready to explore your game collection?
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="text-center">
                    <div className="text-4xl mb-2">📚</div>
                    <div className="text-3xl font-bold text-gray-900">{stats.totalGames}</div>
                    <div className="text-gray-600">Total Games</div>
                </Card>

                <Card className="text-center">
                    <div className="text-4xl mb-2">🎯</div>
                    <div className="text-3xl font-bold text-blue-600">{stats.gamesPlaying}</div>
                    <div className="text-gray-600">Currently Playing</div>
                </Card>

                <Card className="text-center">
                    <div className="text-4xl mb-2">✅</div>
                    <div className="text-3xl font-bold text-green-600">{stats.gamesCompleted}</div>
                    <div className="text-gray-600">Completed</div>
                </Card>

                <Card className="text-center">
                    <div className="text-4xl mb-2">⭐</div>
                    <div className="text-3xl font-bold text-purple-600">{stats.gamesWishlist}</div>
                    <div className="text-gray-600">Wishlist</div>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link to={ROUTES.GAMES}>
                        <Button variant="secondary" className="w-full">
                            🔍 Browse Games
                        </Button>
                    </Link>
                    <Link to={ROUTES.COLLECTION}>
                        <Button variant="secondary" className="w-full">
                            📖 My Collection
                        </Button>
                    </Link>
                    <Link to={ROUTES.WISHLIST}>
                        <Button variant="secondary" className="w-full">
                            ⭐ Wishlist
                        </Button>
                    </Link>
                </div>
            </Card>

            {/* Recent Games */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Recent Games in Catalog</h2>
                    <Link to={ROUTES.GAMES}>
                        <Button variant="secondary" size="sm">View All</Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentGames.map((game) => (
                        <Card key={game.id} className="hover:shadow-lg transition-shadow">
                            <h3 className="font-bold text-lg mb-2 line-clamp-1">{game.title}</h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {game.description || 'No description available'}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {game.release_status && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                        {game.release_status}
                                    </span>
                                )}
                                {game.release_year && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                        {game.release_year}
                                    </span>
                                )}
                            </div>
                            <Link to={`${ROUTES.GAMES}/${game.id}`}>
                                <Button size="sm" className="w-full">View Details</Button>
                            </Link>
                        </Card>
                    ))}
                </div>

                {recentGames.length === 0 && (
                    <Card className="text-center py-12">
                        <p className="text-gray-500">No games available yet</p>
                        <Link to={ROUTES.GAMES}>
                            <Button variant="secondary" className="mt-4">Browse Catalog</Button>
                        </Link>
                    </Card>
                )}
            </div>

            {/* Activity Feed (Future) */}
            <Card>
                <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
                <div className="text-center py-8 text-gray-500">
                    <p>No recent activity</p>
                    <p className="text-sm mt-2">Start adding games to your collection!</p>
                </div>
            </Card>
        </div>
    );
};
