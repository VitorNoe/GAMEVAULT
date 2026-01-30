import React, { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Game } from '../../types/game.types';
import { createImageErrorHandler } from '../../utils/imageUtils';
import { getLimitedStagger } from '../../utils/animations';

interface GameCardProps {
    game: Game;
    index?: number;
    showMetacritic?: boolean;
    showStatus?: boolean;
    onWishlistToggle?: (game: Game) => void;
    isInWishlist?: boolean;
}

const GameCardComponent: React.FC<GameCardProps> = ({
    game,
    index = 0,
    showMetacritic = true,
    showStatus = true,
    onWishlistToggle,
    isInWishlist = false
}) => {
    const handleImageError = useCallback(
        createImageErrorHandler(undefined, 300, 400),
        []
    );

    const handleWishlistClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onWishlistToggle?.(game);
    }, [game, onWishlistToggle]);

    const getMetacriticColor = (score: number | null | undefined): string => {
        if (!score) return 'bg-gray-600';
        if (score >= 75) return 'bg-green-500';
        if (score >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getStatusBadge = (status: string | undefined) => {
        switch (status) {
            case 'released':
                return { text: 'Released', color: 'bg-green-500/80' };
            case 'upcoming':
                return { text: 'Upcoming', color: 'bg-blue-500/80' };
            case 'early_access':
                return { text: 'Early Access', color: 'bg-yellow-500/80' };
            case 'cancelled':
                return { text: 'Cancelled', color: 'bg-red-500/80' };
            default:
                return null;
        }
    };

    const statusBadge = getStatusBadge(game.release_status);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: getLimitedStagger(index) }}
        >
            <Link to={`/games/${game.id}`}>
                <motion.div
                    whileHover={{ y: -8, borderColor: 'rgba(167, 139, 250, 1)' }}
                    className="game-card h-full"
                >
                    <div className="relative h-64 overflow-hidden">
                        {game.cover_url ? (
                            <img
                                src={game.cover_url}
                                alt={game.title}
                                className="w-full h-full object-cover transition-transform duration-300"
                                loading="lazy"
                                onError={handleImageError}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-600/30 to-accent-pink/30 text-white text-center p-4">
                                <span className="text-lg font-semibold">{game.title}</span>
                            </div>
                        )}

                        {/* Metacritic Score */}
                        {showMetacritic && game.metacritic_score && (
                            <div className={`absolute top-2 right-2 ${getMetacriticColor(game.metacritic_score)} text-white text-sm font-bold px-2 py-1 rounded`}>
                                {game.metacritic_score}
                            </div>
                        )}

                        {/* Status Badge */}
                        {showStatus && statusBadge && (
                            <div className={`absolute top-2 left-2 ${statusBadge.color} text-white text-xs font-semibold px-2 py-1 rounded`}>
                                {statusBadge.text}
                            </div>
                        )}

                        {/* Wishlist Button */}
                        {onWishlistToggle && (
                            <button
                                onClick={handleWishlistClick}
                                className={`absolute bottom-2 right-2 p-2 rounded-full transition-all duration-200 ${isInWishlist
                                        ? 'bg-red-500 text-white'
                                        : 'bg-black/50 text-white hover:bg-red-500/80'
                                    }`}
                                aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                            >
                                {isInWishlist ? '❤️' : '🤍'}
                            </button>
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-dark-800 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    <div className="p-4">
                        <h3 className="font-semibold text-lg text-white truncate mb-1">
                            {game.title}
                        </h3>
                        {game.release_year && (
                            <p className="text-gray-400 text-sm">{game.release_year}</p>
                        )}
                        {game.synopsis && (
                            <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                                {game.synopsis}
                            </p>
                        )}
                    </div>
                </motion.div>
            </Link>
        </motion.div>
    );
};

// Memoize the component to prevent unnecessary re-renders
export const GameCard = memo(GameCardComponent);

export default GameCard;
