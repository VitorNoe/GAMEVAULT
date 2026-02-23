import { Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { AuthenticatedRequest } from '../middlewares/auth';
import Review from '../models/Review';
import ReviewLike from '../models/ReviewLike';
import Game from '../models/Game';
import User from '../models/User';
import Platform from '../models/Platform';
import Notification from '../models/Notification';
import UserActivity from '../models/UserActivity';
import sequelize from '../config/database';
import {
  getPaginationParams,
  getPaginationResult,
  parseId,
  successResponse,
  errorResponse,
} from '../utils/helpers';

// ─── Aggregation helper ─────────────────────────────────────────────
/**
 * Recalculate average_rating and total_reviews for a game.
 * Uses AVG / COUNT directly on the reviews table.
 */
async function recalculateGameRating(gameId: number): Promise<void> {
  const result = await Review.findOne({
    where: { game_id: gameId },
    attributes: [
      [fn('AVG', col('rating')), 'avg'],
      [fn('COUNT', col('id')), 'cnt'],
    ],
    raw: true,
  }) as unknown as { avg: string | null; cnt: string };

  const avg = result?.avg ? parseFloat(parseFloat(result.avg).toFixed(2)) : null;
  const cnt = result?.cnt ? parseInt(result.cnt, 10) : 0;

  await Game.update(
    { average_rating: avg, total_reviews: cnt } as any,
    { where: { id: gameId } },
  );
}

/**
 * Recalculate likes_count and dislikes_count for a review.
 */
async function recalculateReviewLikes(reviewId: number): Promise<void> {
  const likes = await ReviewLike.count({ where: { review_id: reviewId, like_type: 'like' } });
  const dislikes = await ReviewLike.count({ where: { review_id: reviewId, like_type: 'dislike' } });

  await Review.update(
    { likes_count: likes, dislikes_count: dislikes },
    { where: { id: reviewId } },
  );
}

// ─── CRUD ────────────────────────────────────────────────────────────

/**
 * Create a review
 * POST /api/reviews
 */
export const createReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json(errorResponse('Not authenticated'));
      return;
    }

    const { game_id, platform_id, rating, review_text, has_spoilers, hours_played, recommends } = req.body;

    // Validate required fields
    if (!game_id || rating === undefined || rating === null) {
      res.status(400).json(errorResponse('game_id and rating are required'));
      return;
    }

    const ratingNum = parseFloat(rating);
    if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 10) {
      res.status(400).json(errorResponse('Rating must be between 0 and 10'));
      return;
    }

    // Check game exists
    const game = await Game.findByPk(game_id);
    if (!game) {
      res.status(404).json(errorResponse('Game not found'));
      return;
    }

    // Check platform exists if provided
    if (platform_id) {
      const platform = await Platform.findByPk(platform_id);
      if (!platform) {
        res.status(404).json(errorResponse('Platform not found'));
        return;
      }
    }

    // Check duplicate (one review per user per game)
    const existing = await Review.findOne({ where: { user_id: userId, game_id } });
    if (existing) {
      res.status(409).json(errorResponse('You already reviewed this game. Use PUT to update.'));
      return;
    }

    const review = await Review.create({
      user_id: userId,
      game_id,
      platform_id: platform_id || undefined,
      rating: ratingNum,
      review_text: review_text || undefined,
      has_spoilers: has_spoilers ?? false,
      hours_played: hours_played || undefined,
      recommends: recommends !== undefined ? recommends : undefined,
    } as any);

    // Recalculate game aggregate
    await recalculateGameRating(game_id);

    const created = await Review.findByPk(review.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'avatar_url'] },
        { model: Game, as: 'game', attributes: ['id', 'title', 'slug', 'cover_url'] },
        { model: Platform, as: 'platform', attributes: ['id', 'name'] },
      ],
    });

    res.status(201).json(successResponse(created, 'Review created successfully'));
  } catch (error: any) {
    console.error('Create review error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json(errorResponse('You already reviewed this game'));
      return;
    }
    res.status(500).json(errorResponse('Error creating review'));
  }
};

/**
 * Update own review
 * PUT /api/reviews/:id
 */
export const updateReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json(errorResponse('Not authenticated'));
      return;
    }

    const reviewId = parseId(req.params.id);
    if (!reviewId) {
      res.status(400).json(errorResponse('Invalid review ID'));
      return;
    }

    const review = await Review.findByPk(reviewId);
    if (!review) {
      res.status(404).json(errorResponse('Review not found'));
      return;
    }

    if (review.user_id !== userId) {
      res.status(403).json(errorResponse('You can only edit your own reviews'));
      return;
    }

    const { rating, review_text, has_spoilers, hours_played, recommends, platform_id } = req.body;

    if (rating !== undefined) {
      const ratingNum = parseFloat(rating);
      if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 10) {
        res.status(400).json(errorResponse('Rating must be between 0 and 10'));
        return;
      }
      review.rating = ratingNum;
    }

    if (platform_id !== undefined) {
      if (platform_id !== null) {
        const platform = await Platform.findByPk(platform_id);
        if (!platform) {
          res.status(404).json(errorResponse('Platform not found'));
          return;
        }
      }
      review.platform_id = platform_id;
    }

    if (review_text !== undefined) review.review_text = review_text;
    if (has_spoilers !== undefined) review.has_spoilers = has_spoilers;
    if (hours_played !== undefined) review.hours_played = hours_played;
    if (recommends !== undefined) review.recommends = recommends;

    await review.save();

    // Recalculate aggregates if rating changed
    await recalculateGameRating(review.game_id);

    const updated = await Review.findByPk(reviewId, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'avatar_url'] },
        { model: Game, as: 'game', attributes: ['id', 'title', 'slug', 'cover_url'] },
        { model: Platform, as: 'platform', attributes: ['id', 'name'] },
      ],
    });

    res.status(200).json(successResponse(updated, 'Review updated successfully'));
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json(errorResponse('Error updating review'));
  }
};

/**
 * Delete own review
 * DELETE /api/reviews/:id
 */
export const deleteReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json(errorResponse('Not authenticated'));
      return;
    }

    const reviewId = parseId(req.params.id);
    if (!reviewId) {
      res.status(400).json(errorResponse('Invalid review ID'));
      return;
    }

    const review = await Review.findByPk(reviewId);
    if (!review) {
      res.status(404).json(errorResponse('Review not found'));
      return;
    }

    if (review.user_id !== userId) {
      res.status(403).json(errorResponse('You can only delete your own reviews'));
      return;
    }

    const gameId = review.game_id;

    // Delete associated likes first
    await ReviewLike.destroy({ where: { review_id: reviewId } });
    await review.destroy();

    // Recalculate game aggregate
    await recalculateGameRating(gameId);

    res.status(200).json(successResponse(null, 'Review deleted successfully'));
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json(errorResponse('Error deleting review'));
  }
};

/**
 * Get a single review by ID
 * GET /api/reviews/:id
 */
export const getReviewById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const reviewId = parseId(req.params.id);
    if (!reviewId) {
      res.status(400).json(errorResponse('Invalid review ID'));
      return;
    }

    const review = await Review.findByPk(reviewId, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'avatar_url'] },
        { model: Game, as: 'game', attributes: ['id', 'title', 'slug', 'cover_url'] },
        { model: Platform, as: 'platform', attributes: ['id', 'name'] },
      ],
    });

    if (!review) {
      res.status(404).json(errorResponse('Review not found'));
      return;
    }

    // If user is authenticated, include their like status
    let userLike = null;
    if (req.user?.id) {
      userLike = await ReviewLike.findOne({
        where: { review_id: reviewId, user_id: req.user.id },
      });
    }

    res.status(200).json(successResponse({
      review,
      userLike: userLike ? userLike.like_type : null,
    }));
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json(errorResponse('Error fetching review'));
  }
};

/**
 * Get reviews for a specific game
 * GET /api/reviews/game/:gameId
 */
export const getGameReviews = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const gameId = parseId(req.params.gameId);
    if (!gameId) {
      res.status(400).json(errorResponse('Invalid game ID'));
      return;
    }

    const game = await Game.findByPk(gameId);
    if (!game) {
      res.status(404).json(errorResponse('Game not found'));
      return;
    }

    const { page, limit, offset } = getPaginationParams(req, 10);
    const sortBy = (req.query.sort as string) || 'created_at';
    const order = ((req.query.order as string) || 'DESC').toUpperCase();

    const validSorts: Record<string, string> = {
      created_at: 'created_at',
      rating: 'rating',
      likes: 'likes_count',
      hours_played: 'hours_played',
    };

    const sortColumn = validSorts[sortBy] || 'created_at';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

    // Filter options
    const where: any = { game_id: gameId };

    if (req.query.has_spoilers === 'false') {
      where.has_spoilers = false;
    }
    if (req.query.recommends === 'true') {
      where.recommends = true;
    } else if (req.query.recommends === 'false') {
      where.recommends = false;
    }
    if (req.query.min_rating) {
      where.rating = { ...where.rating, [Op.gte]: parseFloat(req.query.min_rating as string) };
    }
    if (req.query.max_rating) {
      where.rating = { ...where.rating, [Op.lte]: parseFloat(req.query.max_rating as string) };
    }

    const { count, rows } = await Review.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'avatar_url'] },
        { model: Platform, as: 'platform', attributes: ['id', 'name'] },
      ],
      order: [[sortColumn, sortOrder]],
      limit,
      offset,
    });

    // If user is authenticated, get their like statuses for these reviews
    let userLikes: Record<number, string> = {};
    if (req.user?.id && rows.length > 0) {
      const reviewIds = rows.map(r => r.id);
      const likes = await ReviewLike.findAll({
        where: { review_id: { [Op.in]: reviewIds }, user_id: req.user.id },
      });
      likes.forEach(l => {
        userLikes[l.review_id] = l.like_type;
      });
    }

    const reviewsWithLikeStatus = rows.map(r => ({
      ...r.toJSON(),
      userLike: userLikes[r.id] || null,
    }));

    res.status(200).json(successResponse({
      reviews: reviewsWithLikeStatus,
      gameRating: {
        average_rating: game.get('average_rating'),
        total_reviews: game.get('total_reviews'),
      },
      pagination: getPaginationResult(count, page, limit),
    }));
  } catch (error) {
    console.error('Get game reviews error:', error);
    res.status(500).json(errorResponse('Error fetching game reviews'));
  }
};

/**
 * Get reviews by a specific user
 * GET /api/reviews/user/:userId
 */
export const getUserReviews = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = parseId(req.params.userId);
    if (!userId) {
      res.status(400).json(errorResponse('Invalid user ID'));
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json(errorResponse('User not found'));
      return;
    }

    const { page, limit, offset } = getPaginationParams(req, 10);

    const { count, rows } = await Review.findAndCountAll({
      where: { user_id: userId },
      include: [
        { model: Game, as: 'game', attributes: ['id', 'title', 'slug', 'cover_url'] },
        { model: Platform, as: 'platform', attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json(successResponse({
      reviews: rows,
      pagination: getPaginationResult(count, page, limit),
    }));
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json(errorResponse('Error fetching user reviews'));
  }
};

// ─── Likes / Dislikes ────────────────────────────────────────────────

/**
 * Like or dislike a review (toggle / upsert)
 * POST /api/reviews/:id/like
 * Body: { like_type: 'like' | 'dislike' }
 */
export const likeReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json(errorResponse('Not authenticated'));
      return;
    }

    const reviewId = parseId(req.params.id);
    if (!reviewId) {
      res.status(400).json(errorResponse('Invalid review ID'));
      return;
    }

    const { like_type } = req.body;
    if (!like_type || !['like', 'dislike'].includes(like_type)) {
      res.status(400).json(errorResponse('like_type must be "like" or "dislike"'));
      return;
    }

    const review = await Review.findByPk(reviewId);
    if (!review) {
      res.status(404).json(errorResponse('Review not found'));
      return;
    }

    // Cannot like own review
    if (review.user_id === userId) {
      res.status(400).json(errorResponse('You cannot like your own review'));
      return;
    }

    // Upsert like
    const existing = await ReviewLike.findOne({
      where: { review_id: reviewId, user_id: userId },
    });

    let action: string;
    if (existing) {
      if (existing.like_type === like_type) {
        // Same type – remove it (toggle off)
        await existing.destroy();
        action = 'removed';
      } else {
        // Different type – update
        existing.like_type = like_type;
        await existing.save();
        action = 'updated';
      }
    } else {
      await ReviewLike.create({ review_id: reviewId, user_id: userId, like_type } as any);
      action = 'created';
    }

    // Recalculate counts
    await recalculateReviewLikes(reviewId);

    // Send notification to review author (only for new likes, not dislikes)
    if (action === 'created' && like_type === 'like') {
      try {
        const liker = await User.findByPk(userId, { attributes: ['name'] });
        await Notification.create({
          user_id: review.user_id,
          notification_type: 'review_like',
          game_id: review.game_id,
          title: 'Someone liked your review!',
          message: `${liker?.get('name') || 'A user'} liked your review.`,
        } as any);
      } catch (notifError) {
        // Non-critical, do not fail the request
        console.error('Notification creation error:', notifError);
      }
    }

    // Return updated review counts
    const updatedReview = await Review.findByPk(reviewId, {
      attributes: ['id', 'likes_count', 'dislikes_count'],
    });

    res.status(200).json(successResponse({
      action,
      like_type: action === 'removed' ? null : like_type,
      likes_count: updatedReview?.likes_count,
      dislikes_count: updatedReview?.dislikes_count,
    }, `Review ${action === 'removed' ? 'un' : ''}${like_type}d successfully`));
  } catch (error) {
    console.error('Like review error:', error);
    res.status(500).json(errorResponse('Error processing like'));
  }
};

/**
 * Remove like/dislike from a review
 * DELETE /api/reviews/:id/like
 */
export const unlikeReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json(errorResponse('Not authenticated'));
      return;
    }

    const reviewId = parseId(req.params.id);
    if (!reviewId) {
      res.status(400).json(errorResponse('Invalid review ID'));
      return;
    }

    const review = await Review.findByPk(reviewId);
    if (!review) {
      res.status(404).json(errorResponse('Review not found'));
      return;
    }

    const deleted = await ReviewLike.destroy({
      where: { review_id: reviewId, user_id: userId },
    });

    if (deleted === 0) {
      res.status(404).json(errorResponse('Like not found'));
      return;
    }

    await recalculateReviewLikes(reviewId);

    const updatedReview = await Review.findByPk(reviewId, {
      attributes: ['id', 'likes_count', 'dislikes_count'],
    });

    res.status(200).json(successResponse({
      likes_count: updatedReview?.likes_count,
      dislikes_count: updatedReview?.dislikes_count,
    }, 'Like removed successfully'));
  } catch (error) {
    console.error('Unlike review error:', error);
    res.status(500).json(errorResponse('Error removing like'));
  }
};

// ─── Admin Moderation ────────────────────────────────────────────────

/**
 * Admin delete any review
 * DELETE /api/reviews/admin/:id
 */
export const adminDeleteReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      res.status(401).json(errorResponse('Not authenticated'));
      return;
    }

    const reviewId = parseId(req.params.id);
    if (!reviewId) {
      res.status(400).json(errorResponse('Invalid review ID'));
      return;
    }

    const review = await Review.findByPk(reviewId, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name'] },
        { model: Game, as: 'game', attributes: ['id', 'title'] },
      ],
    });

    if (!review) {
      res.status(404).json(errorResponse('Review not found'));
      return;
    }

    const { reason } = req.body;
    const gameId = review.game_id;
    const reviewData = review.toJSON();

    // Delete associated likes first
    await ReviewLike.destroy({ where: { review_id: reviewId } });
    await review.destroy();

    // Recalculate game aggregate
    await recalculateGameRating(gameId);

    // Log moderation action
    await UserActivity.create({
      user_id: adminId,
      activity_type: 'review_moderation',
      entity_type: 'review',
      entity_id: reviewId,
      description: `Admin deleted review #${reviewId} for game "${(reviewData as any).game?.title || gameId}"`,
      metadata: {
        action: 'delete',
        reason: reason || 'No reason provided',
        review_author_id: reviewData.user_id,
        review_author_name: (reviewData as any).user?.name,
        game_id: gameId,
        review_rating: reviewData.rating,
        review_text_preview: reviewData.review_text?.substring(0, 200),
      },
    } as any);

    res.status(200).json(successResponse(null, 'Review deleted by admin'));
  } catch (error) {
    console.error('Admin delete review error:', error);
    res.status(500).json(errorResponse('Error deleting review'));
  }
};

/**
 * Admin flag a review (soft action – adds metadata without deleting)
 * PUT /api/reviews/admin/:id/flag
 * Body: { reason: string }
 */
export const adminFlagReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      res.status(401).json(errorResponse('Not authenticated'));
      return;
    }

    const reviewId = parseId(req.params.id);
    if (!reviewId) {
      res.status(400).json(errorResponse('Invalid review ID'));
      return;
    }

    const { reason } = req.body;
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      res.status(400).json(errorResponse('A reason is required to flag a review'));
      return;
    }

    const review = await Review.findByPk(reviewId, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name'] },
        { model: Game, as: 'game', attributes: ['id', 'title'] },
      ],
    });

    if (!review) {
      res.status(404).json(errorResponse('Review not found'));
      return;
    }

    // Log moderation action
    await UserActivity.create({
      user_id: adminId,
      activity_type: 'review_moderation',
      entity_type: 'review',
      entity_id: reviewId,
      description: `Admin flagged review #${reviewId} for game "${(review as any).game?.title || review.game_id}"`,
      metadata: {
        action: 'flag',
        reason: reason.trim(),
        review_author_id: review.user_id,
        review_author_name: (review as any).user?.name,
        game_id: review.game_id,
        review_rating: review.rating,
      },
    } as any);

    res.status(200).json(successResponse({ review_id: reviewId, flagged: true, reason: reason.trim() }, 'Review flagged successfully'));
  } catch (error) {
    console.error('Admin flag review error:', error);
    res.status(500).json(errorResponse('Error flagging review'));
  }
};

/**
 * Admin: get all moderation logs for reviews
 * GET /api/reviews/admin/moderation-log
 */
export const getModerationLog = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationParams(req, 20);

    const { count, rows } = await UserActivity.findAndCountAll({
      where: { activity_type: 'review_moderation' },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json(successResponse({
      logs: rows,
      pagination: getPaginationResult(count, page, limit),
    }));
  } catch (error) {
    console.error('Get moderation log error:', error);
    res.status(500).json(errorResponse('Error fetching moderation log'));
  }
};

// ─── Aggregation Job ─────────────────────────────────────────────────

/**
 * Background job to recalculate all game ratings.
 * Can be called manually or via a scheduled task.
 */
export const recalculateAllGameRatings = async (): Promise<{ updated: number }> => {
  const games = await Game.findAll({
    attributes: ['id'],
    include: [{ model: Review, as: 'reviews', attributes: ['id'], required: true }],
  });

  let updated = 0;
  for (const game of games) {
    await recalculateGameRating(game.id);
    updated++;
  }

  console.log(`[ReviewAggregation] Recalculated ratings for ${updated} games`);
  return { updated };
};

/**
 * Admin endpoint to trigger full recalculation
 * POST /api/reviews/admin/recalculate
 */
export const adminRecalculate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await recalculateAllGameRatings();
    res.status(200).json(successResponse(result, 'Ratings recalculated successfully'));
  } catch (error) {
    console.error('Recalculate ratings error:', error);
    res.status(500).json(errorResponse('Error recalculating ratings'));
  }
};
