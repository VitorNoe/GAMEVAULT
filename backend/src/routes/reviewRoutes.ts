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
import { body } from 'express-validator';
import { validate } from '../middlewares/validate';

const router = Router();

// ─── Admin routes (must be before /:id to avoid conflict) ────────────

/**
 * @openapi
 * /reviews/admin/moderation-log:
 *   get:
 *     tags: [Reviews]
 *     summary: Get moderation action log
 *     description: Admin only. Returns a log of all review moderation actions.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Moderation log entries
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/admin/moderation-log', generalLimiter, authenticate, authorizeAdmin, getModerationLog);

/**
 * @openapi
 * /reviews/admin/recalculate:
 *   post:
 *     tags: [Reviews]
 *     summary: Recalculate all game rating aggregates
 *     description: Admin only. Recomputes cached average ratings for all games.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Recalculation complete
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/admin/recalculate', generalLimiter, authenticate, authorizeAdmin, adminRecalculate);

/**
 * @openapi
 * /reviews/admin/{id}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Admin delete any review
 *     description: Admin only. Hard-deletes any review.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Review deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/admin/:id', generalLimiter, authenticate, authorizeAdmin, adminDeleteReview);

/**
 * @openapi
 * /reviews/admin/{id}/flag:
 *   put:
 *     tags: [Reviews]
 *     summary: Admin flag a review
 *     description: Admin only. Flags a review for content moderation.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Review flagged
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/admin/:id/flag', generalLimiter, authenticate, authorizeAdmin, adminFlagReview);

// ─── Public / Authenticated routes ───────────────────────────────────

/**
 * @openapi
 * /reviews/game/{gameId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get all reviews for a game
 *     description: Returns reviews for a game with optional pagination. Like status included when authenticated.
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Game reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
router.get('/game/:gameId', generalLimiter, optionalAuth, getGameReviews);

/**
 * @openapi
 * /reviews/user/{userId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get all reviews by a user
 *     description: Returns all reviews written by the specified user.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: User reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 */
router.get('/user/:userId', generalLimiter, optionalAuth, getUserReviews);

/**
 * @openapi
 * /reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Create a new review
 *     description: Submit a review for a game. One review per user per game.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [game_id, rating]
 *             properties:
 *               game_id:
 *                 type: integer
 *                 example: 42
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 example: 9
 *               title:
 *                 type: string
 *                 example: "A masterpiece"
 *               body:
 *                 type: string
 *                 example: "Incredible open-world experience..."
 *     responses:
 *       201:
 *         description: Review created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 review:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/',
  createLimiter,
  authenticate,
  [
    body('game_id').isInt({ min: 1 }).withMessage('Valid game_id is required'),
    body('rating').isInt({ min: 1, max: 10 }).withMessage('Rating must be between 1 and 10'),
    body('title').optional().isLength({ max: 255 }).withMessage('Title must be at most 255 characters'),
    body('body').optional().isLength({ max: 5000 }).withMessage('Body must be at most 5000 characters'),
  ],
  validate,
  createReview
);

/**
 * @openapi
 * /reviews/{id}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get a single review
 *     description: Returns a review by its ID. Like status included when authenticated.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Review detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 review:
 *                   $ref: '#/components/schemas/Review'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Reviews]
 *     summary: Update own review
 *     description: Update a review you authored.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete own review
 *     description: Deletes a review you authored.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Review deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', generalLimiter, optionalAuth, getReviewById);

router.put(
  '/:id',
  generalLimiter,
  authenticate,
  [
    body('rating').optional().isInt({ min: 1, max: 10 }).withMessage('Rating must be between 1 and 10'),
    body('title').optional().isLength({ max: 255 }).withMessage('Title must be at most 255 characters'),
    body('body').optional().isLength({ max: 5000 }).withMessage('Body must be at most 5000 characters'),
  ],
  validate,
  updateReview
);

router.delete('/:id', generalLimiter, authenticate, deleteReview);

/**
 * @openapi
 * /reviews/{id}/like:
 *   post:
 *     tags: [Reviews]
 *     summary: Like or dislike a review
 *     description: Toggle like/dislike on a review.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_like:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Like toggled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     tags: [Reviews]
 *     summary: Remove like/dislike from a review
 *     description: Removes the user's like or dislike from a review.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Like removed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/:id/like',
  createLimiter,
  authenticate,
  [
    body('is_like').optional().isBoolean().withMessage('is_like must be a boolean'),
  ],
  validate,
  likeReview
);

router.delete('/:id/like', generalLimiter, authenticate, unlikeReview);

export default router;
