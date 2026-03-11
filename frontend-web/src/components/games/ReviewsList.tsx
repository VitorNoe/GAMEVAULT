import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Review, reviewService, CreateReviewData, UpdateReviewData } from '../../services/reviewService';
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

interface ReviewItemProps {
    review: Review;
    currentUserId: number | null;
    onLike: (id: number, type: 'like' | 'dislike') => void;
    onDelete: (id: number) => void;
    onUpdate: (id: number, data: UpdateReviewData) => void;
}

const ReviewItem: React.FC<ReviewItemProps> = memo(
    ({ review, currentUserId, onLike, onDelete, onUpdate }) => {
        const [showSpoiler, setShowSpoiler] = useState(false);
        const [editing, setEditing] = useState(false);
        const [editRating, setEditRating] = useState(review.rating);
        const [editText, setEditText] = useState(review.review_text || '');
        const [editSpoilers, setEditSpoilers] = useState(review.has_spoilers);
        const [editHours, setEditHours] = useState(review.hours_played?.toString() || '');
        const [editRecommends, setEditRecommends] = useState<boolean | undefined>(review.recommends);
        const [saving, setSaving] = useState(false);
        const [confirmDelete, setConfirmDelete] = useState(false);
        const [likeLoading, setLikeLoading] = useState(false);

        const isOwner = currentUserId != null && (review.user_id === currentUserId || (review.user || review.User)?.id === currentUserId);

        const handleSave = async () => {
            setSaving(true);
            await onUpdate(review.id, {
                rating: editRating,
                review_text: editText || undefined,
                has_spoilers: editSpoilers,
                hours_played: editHours ? Number(editHours) : undefined,
                recommends: editRecommends,
            });
            setSaving(false);
            setEditing(false);
        };

        const handleLikeClick = async (type: 'like' | 'dislike') => {
            if (likeLoading) return;
            setLikeLoading(true);
            await onLike(review.id, type);
            setLikeLoading(false);
        };

        if (editing) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-4 rounded-xl space-y-3 border border-primary-500/30"
                >
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-primary-400">Editing Review</h4>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={() => setEditing(false)}
                            className="text-gray-500 hover:text-white text-sm"
                        >
                            ✕ Cancel
                        </motion.button>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Rating</label>
                        <StarRating rating={editRating} interactive onChange={setEditRating} />
                    </div>
                    <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        className="input w-full bg-dark-200 text-white resize-none"
                    />
                    <div className="flex flex-wrap gap-4 items-center">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Hours</label>
                            <input type="number" min="0" value={editHours} onChange={(e) => setEditHours(e.target.value)} className="input w-20 bg-dark-200 text-white text-sm" />
                        </div>
                        <div className="flex gap-2">
                            <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => setEditRecommends(editRecommends === true ? undefined : true)}
                                className={`px-2 py-1 rounded text-xs font-medium ${editRecommends === true ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-dark-300 text-gray-400'}`}>
                                👍
                            </motion.button>
                            <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => setEditRecommends(editRecommends === false ? undefined : false)}
                                className={`px-2 py-1 rounded text-xs font-medium ${editRecommends === false ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-dark-300 text-gray-400'}`}>
                                👎
                            </motion.button>
                        </div>
                        <label className="flex items-center gap-1 cursor-pointer text-xs text-gray-400">
                            <input type="checkbox" checked={editSpoilers} onChange={(e) => setEditSpoilers(e.target.checked)} className="w-3 h-3 rounded border-gray-600 bg-dark-300" />
                            Spoilers
                        </label>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        disabled={saving || editRating === 0}
                        className="btn-primary w-full text-sm disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </motion.button>
                </motion.div>
            );
        }

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 rounded-xl"
            >
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-pink flex items-center justify-center font-bold text-sm">
                            {(review.user || review.User)?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <p className="font-semibold text-white">{(review.user || review.User)?.name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                                {(review.platform || review.Platform) && <span> · on {(review.platform || review.Platform)!.name}</span>}
                                {review.hours_played && <span> · {review.hours_played}h played</span>}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} />
                        {review.recommends !== undefined && review.recommends !== null && (
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

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleLikeClick('like')}
                            disabled={likeLoading}
                            className={`flex items-center gap-1 text-sm transition-colors disabled:opacity-50 ${review.userLike === 'like' ? 'text-primary-400' : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            👍 <span>{review.likes_count || 0}</span>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleLikeClick('dislike')}
                            disabled={likeLoading}
                            className={`flex items-center gap-1 text-sm transition-colors disabled:opacity-50 ${review.userLike === 'dislike' ? 'text-red-400' : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            👎 <span>{review.dislikes_count || 0}</span>
                        </motion.button>
                    </div>
                    {isOwner && (
                        <div className="flex items-center gap-2">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setEditRating(review.rating);
                                    setEditText(review.review_text || '');
                                    setEditSpoilers(review.has_spoilers);
                                    setEditHours(review.hours_played?.toString() || '');
                                    setEditRecommends(review.recommends);
                                    setEditing(true);
                                }}
                                className="text-xs text-gray-500 hover:text-primary-400 transition-colors px-2 py-1 rounded hover:bg-primary-500/10"
                            >
                                ✏️ Edit
                            </motion.button>
                            {confirmDelete ? (
                                <div className="flex items-center gap-1">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onDelete(review.id)}
                                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-500/10"
                                    >
                                        Confirm
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setConfirmDelete(false)}
                                        className="text-xs text-gray-500 hover:text-white px-2 py-1 rounded"
                                    >
                                        Cancel
                                    </motion.button>
                                </div>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setConfirmDelete(true)}
                                    className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
                                >
                                    🗑️ Delete
                                </motion.button>
                            )}
                        </div>
                    )}
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
    const { isAuthenticated, user } = useAuth();
    const [likeError, setLikeError] = useState<string | null>(null);

    const handleLike = async (reviewId: number, type: 'like' | 'dislike') => {
        if (!isAuthenticated) {
            setLikeError('Log in to like reviews');
            setTimeout(() => setLikeError(null), 3000);
            return;
        }
        try {
            await reviewService.likeReview(reviewId, type);
            onReviewAdded();
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to like review';
            setLikeError(msg);
            setTimeout(() => setLikeError(null), 3000);
        }
    };

    const handleDelete = async (reviewId: number) => {
        try {
            await reviewService.deleteReview(reviewId);
            onReviewAdded();
        } catch {
            // silent
        }
    };

    const handleUpdate = async (reviewId: number, data: UpdateReviewData) => {
        try {
            await reviewService.updateReview(reviewId, data);
            onReviewAdded();
        } catch {
            // silent
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                    Reviews {reviews.length > 0 && <span className="text-gray-500 text-base">({reviews.length})</span>}
                </h3>
            </div>

            {likeError && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-sm text-red-300"
                >
                    {likeError}
                </motion.div>
            )}

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
                            <ReviewItem
                                key={review.id}
                                review={review}
                                currentUserId={user?.id ?? null}
                                onLike={handleLike}
                                onDelete={handleDelete}
                                onUpdate={handleUpdate}
                            />
                        ))}
                    </div>
                </AnimatePresence>
            )}
        </div>
    );
};

export const ReviewsList = memo(ReviewsListComponent);
