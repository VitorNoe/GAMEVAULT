import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { gameService } from '../services/gameService';
import { Game } from '../types/game.types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { ROUTES, RELEASE_STATUS_LABELS } from '../utils/constants';

// Placeholder image for games without cover
const PLACEHOLDER_IMAGE = 'https://placehold.co/300x400/1f2937/ffffff?text=No+Cover';

export const Wishlist: React.FC = () => {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [wishlistIds, setWishlistIds] = useState<number[]>([]);

    const fetchWishlistGames = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            // Get wishlist IDs from localStorage
            const storedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
            setWishlistIds(storedWishlist);

            if (storedWishlist.length === 0) {
                setGames([]);
                setLoading(false);
                return;
            }

            // Fetch all games and filter by wishlist IDs
            const response = await gameService.getAllGames({ page: 1, limit: 100 });
            const allGames = response.data?.games || [];
            const wishlistGames = allGames.filter((game: Game) => storedWishlist.includes(game.id));
            setGames(wishlistGames);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load wishlist');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWishlistGames();
    }, [fetchWishlistGames]);

    const removeFromWishlist = (gameId: number) => {
        const newWishlist = wishlistIds.filter(id => id !== gameId);
        localStorage.setItem('wishlist', JSON.stringify(newWishlist));
        setWishlistIds(newWishlist);
        setGames(games.filter(game => game.id !== gameId));
    };

    const clearWishlist = () => {
        if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
            localStorage.setItem('wishlist', JSON.stringify([]));
            setWishlistIds([]);
            setGames([]);
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold mb-2">⭐ My Wishlist</h1>
                    <p className="text-gray-600">
                        {games.length} {games.length === 1 ? 'game' : 'games'} in your wishlist
                    </p>
                </div>
                {games.length > 0 && (
                    <Button variant="secondary" onClick={clearWishlist}>
                        🗑️ Clear Wishlist
                    </Button>
                )}
            </div>

            {games.length > 0 && (
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search wishlist..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            )}

            {error && <ErrorMessage message={error} onRetry={fetchWishlistGames} />}

            {filteredGames.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredGames.map((game) => (
                        <Card key={game.id} padding="none" className="h-full hover:shadow-lg transition-shadow">
                            <Link to={`${ROUTES.GAMES}/${game.id}`}>
                                <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                                    <img
                                        src={game.cover_url || PLACEHOLDER_IMAGE}
                                        alt={game.title}
                                        className="w-full h-full object-cover"
                                        onError={handleImageError}
                                    />
                                    {game.metacritic_score && (
                                        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-white text-sm font-bold ${game.metacritic_score >= 90 ? 'bg-green-600' :
                                                game.metacritic_score >= 75 ? 'bg-yellow-500' :
                                                    game.metacritic_score >= 50 ? 'bg-orange-500' : 'bg-red-600'
                                            }`}>
                                            {game.metacritic_score}
                                        </div>
                                    )}
                                </div>
                            </Link>
                            <div className="p-4">
                                <Link to={`${ROUTES.GAMES}/${game.id}`}>
                                    <h3 className="font-bold text-lg mb-2 line-clamp-2 hover:text-blue-600">
                                        {game.title}
                                    </h3>
                                </Link>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge variant="info" size="sm">
                                        {RELEASE_STATUS_LABELS[game.release_status]}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                                    <span>
                                        {game.release_date
                                            ? new Date(game.release_date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short'
                                            })
                                            : game.release_year || 'TBA'}
                                    </span>
                                    {game.average_rating && game.average_rating > 0 && (
                                        <span className="flex items-center">
                                            ⭐ {game.average_rating.toFixed(1)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Link to={`${ROUTES.GAMES}/${game.id}`} className="flex-1">
                                        <Button size="sm" className="w-full">View</Button>
                                    </Link>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            removeFromWishlist(game.id);
                                        }}
                                    >
                                        ✕
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="text-center py-16">
                    <div className="text-6xl mb-4">⭐</div>
                    <h3 className="text-2xl font-bold mb-2">
                        {searchQuery ? 'No games found' : 'Your wishlist is empty'}
                    </h3>
                    <p className="text-gray-600 mb-6">
                        {searchQuery
                            ? 'Try a different search term'
                            : 'Browse our game catalog and add games you want to play!'}
                    </p>
                    {!searchQuery && (
                        <Link to={ROUTES.GAMES}>
                            <Button size="lg">🎮 Browse Games</Button>
                        </Link>
                    )}
                </Card>
            )}
        </div>
    );
};
