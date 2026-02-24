import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Review, reviewService, CreateReviewData } from '../../services/reviewService';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface ReviewsListProps {
    gameId: number;
    reviews: Review[];
    onReviewAdded: () => void;
    loading?: boolean;
}

const StarRating: React.FC<{ rating: number; interactive?: boolean; onChange?: (r: number) => void }> = ({
    rating,
    interactive = false,
    onChange,
}) => {
    const [hover, setHover] = useState(0);

    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                    key={star}
                    type="button"
                    whileHover={interactive ? { scale: 1.2 } : undefined}
                    whileTap={interactive ? { scale: 0.9 } : undefined}
                    onClick={() => interactive && onChange?.(star)}
                    onMouseEnter={() => interactive && setHover(star)}
                    onMouseLeave={() => interactive && setHover(0)}
                    className={`text-xl transition-colors ${interactive ? 'cursor-pointer' : 'cursor-default'} ${star <= (hover || rating) ? 'text-yellow-400' : 'text-gray-600'
                        }`}
                    disabled={!interactive}
                >
                    ★
                </motion.button>
            ))}
        </div>
    );
};

const ReviewItem: React.FC<{ review: Review; onLike: (id: number, type: 'like' | 'dislike') => void }> = memo(
    ({ review, onLike }) => {
        const [showSpoiler, setShowSpoiler] = useState(false);

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 rounded-xl"
            >
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-pink flex items-center justify-center font-bold text-sm">
                            {review.User?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <p className="font-semibold text-white">{review.User?.name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                                {review.Platform && <span> · on {review.Platform.name}</span>}
                                {review.hours_played && <span> · {review.hours_played}h played</span>}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} />
                        {review.recommends !== undefined && (
                            <span className={`text-sm font-medium ${review.recommends ? 'text-green-400' : 'text-red-400'}`}>
                                {review.recommends ? '👍' : '👎'}
                            </span>
                        )}
                    </div>
                </div>

                {review.has_spoilers && !showSpoiler ? (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setShowSpoiler(true)}
                        className="w-full py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-medium"
                    >
                        ⚠️ This review contains spoilers. Click to reveal.
                    </motion.button>
                ) : (
                    review.review_text && (
                        <p className="text-gray-300 text-sm leading-relaxed mb-3">{review.review_text}</p>
                    )
                )}

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onLike(review.id, 'like')}
                        className={`flex items-center gap-1 text-sm transition-colors ${review.userLike === 'like' ? 'text-primary-400' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        👍 <span>{review.likes_count || 0}</span>
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onLike(review.id, 'dislike')}
                        className={`flex items-center gap-1 text-sm transition-colors ${review.userLike === 'dislike' ? 'text-red-400' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        👎 <span>{review.dislikes_count || 0}</span>
                    </motion.button>
                </div>
            </motion.div>
        );
    }
);

ReviewItem.displayName = 'ReviewItem';

const WriteReviewForm: React.FC<{ gameId: number; onSubmit: () => void }> = ({ gameId, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');
    const [hasSpoilers, setHasSpoilers] = useState(false);
    const [hoursPlayed, setHoursPlayed] = useState('');
    const [recommends, setRecommends] = useState<boolean | undefined>(undefined);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        setSubmitting(true);
        setError('');
        try {
            const data: CreateReviewData = {
                game_id: gameId,
                rating,
                review_text: text || undefined,
                has_spoilers: hasSpoilers,
                hours_played: hoursPlayed ? Number(hoursPlayed) : undefined,
                recommends,
            };
            await reviewService.createReview(data);
            setRating(0);
            setText('');
            setHasSpoilers(false);
            setHoursPlayed('');
            setRecommends(undefined);
            onSubmit();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="glass-card p-5 rounded-xl space-y-4"
        >
            <h4 className="text-lg font-bold text-white">Write a Review</h4>

            {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-sm text-red-300">{error}</div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Rating *</label>
                <StarRating rating={rating} interactive onChange={setRating} />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Your Review</label>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Share your thoughts about this game..."
                    rows={4}
                    className="input w-full bg-dark-200 text-white resize-none"
                />
            </div>

            <div className="flex flex-wrap gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Hours Played</label>
                    <input
                        type="number"
                        min="0"
                        value={hoursPlayed}
                        onChange={(e) => setHoursPlayed(e.target.value)}
                        placeholder="0"
                        className="input w-24 bg-dark-200 text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Recommend?</label>
                    <div className="flex gap-2 mt-1">
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setRecommends(recommends === true ? undefined : true)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${recommends === true
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                    : 'bg-dark-300 text-gray-400 hover:text-white'
                                }`}
                        >
                            👍 Yes
                        </motion.button>
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setRecommends(recommends === false ? undefined : false)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${recommends === false
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                                    : 'bg-dark-300 text-gray-400 hover:text-white'
                                }`}
                        >
                            👎 No
                        </motion.button>
                    </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer self-end pb-1">
                    <input
                        type="checkbox"
                        checked={hasSpoilers}
                        onChange={(e) => setHasSpoilers(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 text-primary-500 focus:ring-primary-500 bg-dark-300"
                    />
                    <span className="text-sm text-gray-400">Contains spoilers</span>
                </label>
            </div>

            <motion.button
                type="submit"
                disabled={submitting || rating === 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {submitting ? 'Submitting...' : 'Submit Review'}
            </motion.button>
        </motion.form>
    );
};

const ReviewsListComponent: React.FC<ReviewsListProps> = ({ gameId, reviews, onReviewAdded, loading }) => {
    const { isAuthenticated } = useAuth();

    const handleLike = async (reviewId: number, type: 'like' | 'dislike') => {
        if (!isAuthenticated) return;
        try {
            await reviewService.likeReview(reviewId, type);
            onReviewAdded(); // Refresh reviews
        } catch {
            // Ignore like errors silently
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                    Reviews {reviews.length > 0 && <span className="text-gray-500 text-base">({reviews.length})</span>}
                </h3>
            </div>

            {isAuthenticated && <WriteReviewForm gameId={gameId} onSubmit={onReviewAdded} />}

            {loading ? (
                <div className="text-center py-8 text-gray-500">Loading reviews...</div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <p className="text-4xl mb-2">📝</p>
                    <p>No reviews yet. Be the first to review!</p>
                </div>
            ) : (
                <AnimatePresence>
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <ReviewItem key={review.id} review={review} onLike={handleLike} />
                        ))}
                    </div>
                </AnimatePresence>
            )}
        </div>
    );
};

export const ReviewsList = memo(ReviewsListComponent);
