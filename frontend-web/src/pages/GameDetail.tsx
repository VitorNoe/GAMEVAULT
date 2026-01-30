import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { gameService } from '../services/gameService';
import { Game } from '../types/game.types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useAuth } from '../hooks/useAuth';
import { RELEASE_STATUS_LABELS, AVAILABILITY_STATUS_LABELS, ROUTES } from '../utils/constants';

// Placeholder image for games without cover
const PLACEHOLDER_IMAGE = 'https://placehold.co/400x600/1f2937/ffffff?text=No+Cover';

export const GameDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [game, setGame] = useState<Game | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    useEffect(() => {
        const fetchGame = async () => {
            if (!id) return;

            try {
                setLoading(true);
                setError('');
                const gameData = await gameService.getGameById(parseInt(id));
                setGame(gameData);

                // Check if game is in wishlist (from localStorage for now)
                const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
                setIsInWishlist(wishlist.includes(parseInt(id)));
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

        setWishlistLoading(false);
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
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Game not found</h1>
                <Link to={ROUTES.GAMES}>
                    <Button>← Back to Games</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Back button */}
            <div className="mb-6">
                <Link to={ROUTES.GAMES} className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
                    ← Back to Games
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Cover Image */}
                <div className="lg:col-span-1">
                    <Card padding="none" className="overflow-hidden">
                        <div className="relative">
                            <img
                                src={game.cover_url || PLACEHOLDER_IMAGE}
                                alt={game.title}
                                className="w-full h-auto object-cover"
                                onError={handleImageError}
                            />
                            {game.metacritic_score && (
                                <div className={`absolute top-4 right-4 px-3 py-2 rounded-lg text-white text-xl font-bold shadow-lg ${game.metacritic_score >= 90 ? 'bg-green-600' :
                                    game.metacritic_score >= 75 ? 'bg-yellow-500' :
                                        game.metacritic_score >= 50 ? 'bg-orange-500' : 'bg-red-600'
                                    }`}>
                                    {game.metacritic_score}
                                </div>
                            )}
                        </div>
                    </Card>

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

                        {game.trailer_url && (
                            <a href={game.trailer_url} target="_blank" rel="noopener noreferrer" className="block">
                                <Button variant="secondary" className="w-full">
                                    🎬 Watch Trailer
                                </Button>
                            </a>
                        )}
                    </div>
                </div>

                {/* Right Column - Game Info */}
                <div className="lg:col-span-2">
                    <Card>
                        {/* Title and Badges */}
                        <div className="mb-6">
                            <h1 className="text-4xl font-bold text-gray-900 mb-4">{game.title}</h1>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="info" size="md">
                                    {RELEASE_STATUS_LABELS[game.release_status]}
                                </Badge>
                                <Badge
                                    variant={game.availability_status === 'available' ? 'success' : 'warning'}
                                    size="md"
                                >
                                    {AVAILABILITY_STATUS_LABELS[game.availability_status]}
                                </Badge>
                                {game.age_rating && (
                                    <Badge variant="default" size="md">
                                        {game.age_rating}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Synopsis */}
                        {game.synopsis && (
                            <div className="mb-6">
                                <p className="text-xl text-gray-700 italic">{game.synopsis}</p>
                            </div>
                        )}

                        {/* Description */}
                        {game.description && (
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold mb-2">About</h2>
                                <p className="text-gray-600 leading-relaxed">{game.description}</p>
                            </div>
                        )}

                        {/* Game Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase">Release Date</h3>
                                    <p className="text-lg text-gray-900">
                                        {formatDate(game.release_date)}
                                        {game.release_year && !game.release_date && ` (${game.release_year})`}
                                    </p>
                                </div>

                                {game.average_rating !== undefined && game.average_rating > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 uppercase">User Rating</h3>
                                        <p className="text-lg text-gray-900">
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
                                        <p className="text-lg text-gray-900">
                                            <span className={`inline-block px-2 py-1 rounded text-white font-bold ${game.metacritic_score >= 90 ? 'bg-green-600' :
                                                game.metacritic_score >= 75 ? 'bg-yellow-500' :
                                                    game.metacritic_score >= 50 ? 'bg-orange-500' : 'bg-red-600'
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
                                        <p className="text-lg text-gray-900">{game.age_rating}</p>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase">Status</h3>
                                    <p className="text-lg text-gray-900">
                                        {RELEASE_STATUS_LABELS[game.release_status]}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase">Availability</h3>
                                    <p className="text-lg text-gray-900">
                                        {AVAILABILITY_STATUS_LABELS[game.availability_status]}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        {(game.is_early_access || game.was_rereleased) && (
                            <div className="border-t pt-4">
                                <div className="flex flex-wrap gap-3">
                                    {game.is_early_access && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                                            🎮 Early Access
                                        </span>
                                    )}
                                    {game.was_rereleased && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                                            🔄 Re-released
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Additional Cards */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="text-center">
                            <div className="text-4xl mb-2">📅</div>
                            <h3 className="font-semibold">Release Year</h3>
                            <p className="text-2xl font-bold text-blue-600">
                                {game.release_year || 'TBA'}
                            </p>
                        </Card>

                        <Card className="text-center">
                            <div className="text-4xl mb-2">📊</div>
                            <h3 className="font-semibold">Reviews</h3>
                            <p className="text-2xl font-bold text-blue-600">
                                {game.total_reviews || 0}
                            </p>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};
