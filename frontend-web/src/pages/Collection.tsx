import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gameService } from '../services/gameService';
import { Game } from '../types/game.types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { ROUTES } from '../utils/constants';

export const Collection: React.FC = () => {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

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
            <div>
                <h1 className="text-4xl font-bold mb-2">My Collection</h1>
                <p className="text-gray-600">Manage your game collection</p>
            </div>

            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your collection..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {error && <ErrorMessage message={error} onRetry={fetchCollection} />}

            {filteredGames.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredGames.map((game) => (
                        <Card key={game.id} className="hover:shadow-lg transition-shadow">
                            <h3 className="font-bold text-lg mb-2 line-clamp-1">{game.title}</h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {game.description || 'No description'}
                            </p>
                            <Link to={`${ROUTES.GAMES}/${game.id}`}>
                                <Button size="sm" className="w-full">View Details</Button>
                            </Link>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="text-center py-16">
                    <h3 className="text-2xl font-bold mb-2">
                        {searchQuery ? 'No games found' : 'Your collection is empty'}
                    </h3>
                    <p className="text-gray-600 mb-6">
                        {searchQuery ? 'Try a different search' : 'Start adding games!'}
                    </p>
                    {!searchQuery && (
                        <Link to={ROUTES.GAMES}>
                            <Button>Browse Games</Button>
                        </Link>
                    )}
                </Card>
            )}
        </div>
    );
};
