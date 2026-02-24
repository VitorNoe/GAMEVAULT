import { Op, WhereOptions } from 'sequelize';
import Review from '../models/Review';
import Game from '../models/Game';
import User from '../models/User';
import ReviewLike from '../models/ReviewLike';
import UserActivity from '../models/UserActivity';
import { logAdminAction } from './adminService';

// ─── Review moderation ───────────────────────────────────────────────

export type ModerationAction = 'approve' | 'flag' | 'remove';

/**
 * Change the moderation status of a review.
 */
export async function moderateReview(
  reviewId: number,
  action: ModerationAction,
  adminId: number,
  reason?: string,
): Promise<Review> {
  const review = await Review.findByPk(reviewId, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'name'] },
      { model: Game, as: 'game', attributes: ['id', 'title'] },
    ],
  });

  if (!review) {
    const err: any = new Error('Review not found');
    err.status = 404;
    throw err;
  }

  const statusMap: Record<ModerationAction, string> = {
    approve: 'approved',
    flag: 'flagged',
    remove: 'removed',
  };

  const previousStatus = review.moderation_status;
  review.moderation_status = statusMap[action] as any;
  review.moderation_reason = reason || undefined;
  review.moderated_by = adminId;
  review.moderated_at = new Date();
  await review.save();

  // If review was removed, recalculate game rating
  if (action === 'remove') {
    await recalculateGameRating(review.game_id);
  }

  // If review was re-approved after being removed, recalculate
  if (action === 'approve' && previousStatus === 'removed') {
    await recalculateGameRating(review.game_id);
  }

  await logAdminAction(
    adminId,
    'admin_moderation',
    'review',
    reviewId,
    `${action} review #${reviewId} by user #${review.user_id} on game #${review.game_id}`,
    {
      action,
      previous_status: previousStatus,
      new_status: statusMap[action],
      reason,
      game_title: (review as any).game?.title,
      user_name: (review as any).user?.name,
    },
  );

  return review;
}

/**
 * List reviews with moderation filters (for admin panel).
 */
export async function listReviewsForModeration(
  filters: { status?: string; gameId?: number; userId?: number },
  limit: number,
  offset: number,
): Promise<{ rows: Review[]; count: number }> {
  const where: WhereOptions = {};

  if (filters.status) {
    (where as any).moderation_status = filters.status;
  }
  if (filters.gameId) {
    (where as any).game_id = filters.gameId;
  }
  if (filters.userId) {
    (where as any).user_id = filters.userId;
  }

  return Review.findAndCountAll({
    where,
    include: [
      { model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar_url'] },
      { model: Game, as: 'game', attributes: ['id', 'title', 'slug', 'cover_url'] },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
}

// ─── Game moderation (soft-remove / restore) ─────────────────────────

/**
 * Admin-remove a game (hard delete — existing pattern).
 * Logs the action for audit trail.
 */
export async function adminRemoveGame(
  gameId: number,
  adminId: number,
  reason?: string,
): Promise<void> {
  const game = await Game.findByPk(gameId, { attributes: ['id', 'title', 'slug'] });
  if (!game) {
    const err: any = new Error('Game not found');
    err.status = 404;
    throw err;
  }

  const gameTitle = game.title;
  await game.destroy();

  await logAdminAction(
    adminId,
    'admin_moderation',
    'game',
    gameId,
    `Removed game: ${gameTitle}${reason ? ` — ${reason}` : ''}`,
    { game_title: gameTitle, reason },
  );
}

/**
 * Admin hard-delete a review with full cleanup (likes, rating recalc).
 */
export async function adminHardDeleteReview(
  reviewId: number,
  adminId: number,
  reason?: string,
): Promise<void> {
  const review = await Review.findByPk(reviewId, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'name'] },
      { model: Game, as: 'game', attributes: ['id', 'title'] },
    ],
  });

  if (!review) {
    const err: any = new Error('Review not found');
    err.status = 404;
    throw err;
  }

  const gameId = review.game_id;
  const gameName = (review as any).game?.title;
  const userName = (review as any).user?.name;

  // Delete likes first
  await ReviewLike.destroy({ where: { review_id: reviewId } });
  await review.destroy();

  // Recalculate game rating
  await recalculateGameRating(gameId);

  await logAdminAction(
    adminId,
    'admin_moderation',
    'review',
    reviewId,
    `Hard-deleted review #${reviewId} by ${userName} on "${gameName}"${reason ? ` — ${reason}` : ''}`,
    { game_id: gameId, game_title: gameName, user_name: userName, reason },
  );
}

// ─── Moderation log ──────────────────────────────────────────────────

export async function getModerationActions(
  filters: { entityType?: string; adminId?: number },
  limit: number,
  offset: number,
): Promise<{ rows: UserActivity[]; count: number }> {
  const where: any = {
    activity_type: { [Op.like]: 'admin_%' },
  };

  if (filters.entityType) {
    where.entity_type = filters.entityType;
  }
  if (filters.adminId) {
    where.user_id = filters.adminId;
  }

  return UserActivity.findAndCountAll({
    where,
    include: [
      { model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar_url'] },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
}

// ─── Rating recalculation helper ─────────────────────────────────────

async function recalculateGameRating(gameId: number): Promise<void> {
  const reviews = await Review.findAll({
    where: {
      game_id: gameId,
      moderation_status: { [Op.ne]: 'removed' },
    },
    attributes: ['rating'],
  });

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + parseFloat(String(r.rating)), 0) / totalReviews
    : 0;

  await Game.update(
    {
      average_rating: Math.round(averageRating * 100) / 100,
      total_reviews: totalReviews,
    },
    { where: { id: gameId } },
  );
}
