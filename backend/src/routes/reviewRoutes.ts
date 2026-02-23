import { Router } from 'express';
import {
  createReview,
  updateReview,
  deleteReview,
  getReviewById,
  getGameReviews,
  getUserReviews,
  likeReview,
  unlikeReview,
  adminDeleteReview,
  adminFlagReview,
  getModerationLog,
  adminRecalculate,
} from '../controllers/reviewController';
import { authenticate, authorizeAdmin, optionalAuth } from '../middlewares/auth';
import { generalLimiter, createLimiter } from '../middlewares/rateLimiter';

const router = Router();

// ─── Admin routes (must be before /:id to avoid conflict) ────────────
/**
 * @route GET /api/reviews/admin/moderation-log
 * @desc Get moderation action log
 * @access Admin
 */
router.get('/admin/moderation-log', generalLimiter, authenticate, authorizeAdmin, getModerationLog);

/**
 * @route POST /api/reviews/admin/recalculate
 * @desc Recalculate all game rating aggregates
 * @access Admin
 */
router.post('/admin/recalculate', generalLimiter, authenticate, authorizeAdmin, adminRecalculate);

/**
 * @route DELETE /api/reviews/admin/:id
 * @desc Admin delete any review
 * @access Admin
 */
router.delete('/admin/:id', generalLimiter, authenticate, authorizeAdmin, adminDeleteReview);

/**
 * @route PUT /api/reviews/admin/:id/flag
 * @desc Admin flag a review
 * @access Admin
 */
router.put('/admin/:id/flag', generalLimiter, authenticate, authorizeAdmin, adminFlagReview);

// ─── Public / Authenticated routes ───────────────────────────────────

/**
 * @route GET /api/reviews/game/:gameId
 * @desc Get all reviews for a game (with optional auth for like status)
 * @access Public (optional auth)
 */
router.get('/game/:gameId', generalLimiter, optionalAuth, getGameReviews);

/**
 * @route GET /api/reviews/user/:userId
 * @desc Get all reviews by a user
 * @access Public (optional auth)
 */
router.get('/user/:userId', generalLimiter, optionalAuth, getUserReviews);

/**
 * @route POST /api/reviews
 * @desc Create a new review
 * @access Private
 */
router.post('/', createLimiter, authenticate, createReview);

/**
 * @route GET /api/reviews/:id
 * @desc Get a single review by ID
 * @access Public (optional auth for like status)
 */
router.get('/:id', generalLimiter, optionalAuth, getReviewById);

/**
 * @route PUT /api/reviews/:id
 * @desc Update own review
 * @access Private
 */
router.put('/:id', generalLimiter, authenticate, updateReview);

/**
 * @route DELETE /api/reviews/:id
 * @desc Delete own review
 * @access Private
 */
router.delete('/:id', generalLimiter, authenticate, deleteReview);

/**
 * @route POST /api/reviews/:id/like
 * @desc Like or dislike a review (toggle)
 * @access Private
 */
router.post('/:id/like', createLimiter, authenticate, likeReview);

/**
 * @route DELETE /api/reviews/:id/like
 * @desc Remove like/dislike from a review
 * @access Private
 */
router.delete('/:id/like', generalLimiter, authenticate, unlikeReview);

export default router;
