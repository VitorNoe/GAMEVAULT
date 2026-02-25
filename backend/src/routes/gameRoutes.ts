import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllGames,
  getGameById,
  createGame,
  updateGame,
  deleteGame,
  searchGames,
  getUpcomingReleases,
  getAbandonwareGames,
  getGotyGames
} from '../controllers/gameController';
import {
  getGamePlatforms,
  setGamePlatforms,
  removeGamePlatform,
} from '../controllers/platformController';
import {
  changeGameStatus,
  getGameStatusHistory,
  getGameCountdown,
  getUpcomingWithCountdowns,
  getReleaseTimeline,
} from '../controllers/releaseStatusController';
import { authenticate, authorizeAdmin, optionalAuth } from '../middlewares/auth';
import { generalLimiter, createLimiter } from '../middlewares/rateLimiter';

const router = Router();

/**
 * @openapi
 * /games/search:
 *   get:
 *     tags: [Games]
 *     summary: Search games
 *     description: Full-text search across game titles, descriptions, genres, and tags.
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
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
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 games:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Game'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
router.get('/search', generalLimiter, optionalAuth, searchGames);

/**
 * @openapi
 * /games/upcoming-releases:
 *   get:
 *     tags: [Games]
 *     summary: Get upcoming game releases
 *     description: Auto-detects upcoming games based on the system date.
 *     parameters:
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
 *         description: Upcoming releases
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 games:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Game'
 */
router.get('/upcoming-releases', generalLimiter, optionalAuth, getUpcomingReleases);

/**
 * @openapi
 * /games/abandonware:
 *   get:
 *     tags: [Games]
 *     summary: Get abandonware games
 *     description: Returns games marked with abandonware availability status.
 *     responses:
 *       200:
 *         description: Abandonware games
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 games:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Game'
 */
router.get('/abandonware', generalLimiter, optionalAuth, getAbandonwareGames);

/**
 * @openapi
 * /games/goty:
 *   get:
 *     tags: [Games]
 *     summary: Get Game of the Year tagged games
 *     description: Returns games marked with the GOTY tag.
 *     responses:
 *       200:
 *         description: GOTY games
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 games:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Game'
 */
router.get('/goty', generalLimiter, optionalAuth, getGotyGames);

// ─── Release Status & Countdown routes ───

/**
 * @openapi
 * /games/upcoming-countdown:
 *   get:
 *     tags: [Games]
 *     summary: Get all upcoming games with countdown info
 *     description: Returns upcoming games enriched with days-until-release countdown.
 *     responses:
 *       200:
 *         description: Upcoming games with countdowns
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 games:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Game'
 *                       - type: object
 *                         properties:
 *                           days_until_release:
 *                             type: integer
 *                             example: 42
 */
router.get('/upcoming-countdown', generalLimiter, optionalAuth, getUpcomingWithCountdowns);

/**
 * @openapi
 * /games/release-timeline:
 *   get:
 *     tags: [Games]
 *     summary: Get global release/status timeline
 *     description: Returns status change history across all games. Filterable by type.
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [release, availability]
 *         description: Filter by status type
 *     responses:
 *       200:
 *         description: Timeline entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 timeline:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/release-timeline', generalLimiter, optionalAuth, getReleaseTimeline);

/**
 * @openapi
 * /games:
 *   get:
 *     tags: [Games]
 *     summary: Get all games
 *     description: Returns paginated list of all games with optional filters.
 *     parameters:
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
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *       - in: query
 *         name: release_status
 *         schema:
 *           type: string
 *           enum: [released, early_access, open_beta, closed_beta, alpha, coming_soon, in_development, cancelled]
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [title, release_date, metacritic_score, created_at]
 *     responses:
 *       200:
 *         description: List of games
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 games:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Game'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *   post:
 *     tags: [Games]
 *     summary: Create a new game
 *     description: Admin only. Creates a new game in the catalog.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGameRequest'
 *     responses:
 *       201:
 *         description: Game created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 game:
 *                   $ref: '#/components/schemas/Game'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', generalLimiter, optionalAuth, getAllGames);

router.post(
  '/',
  createLimiter,
  authenticate,
  authorizeAdmin,
  [
    body('title')
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 255 })
      .withMessage('Title must be at most 255 characters'),
    body('slug')
      .notEmpty()
      .withMessage('Slug is required')
      .isSlug()
      .withMessage('Slug must be a valid URL slug')
      .isLength({ max: 255 })
      .withMessage('Slug must be at most 255 characters'),
    body('release_status')
      .optional()
      .isIn(['released', 'early_access', 'open_beta', 'closed_beta', 'alpha', 'coming_soon', 'in_development', 'cancelled'])
      .withMessage('Invalid release status'),
    body('availability_status')
      .optional()
      .isIn(['available', 'out_of_catalog', 'expired_license', 'abandonware', 'public_domain', 'discontinued', 'rereleased'])
      .withMessage('Invalid availability status')
  ],
  createGame
);

/**
 * @openapi
 * /games/{id}:
 *   get:
 *     tags: [Games]
 *     summary: Get game by ID
 *     description: Returns a single game with full details.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Game detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 game:
 *                   $ref: '#/components/schemas/Game'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Games]
 *     summary: Update game
 *     description: Admin only. Updates an existing game.
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
 *             $ref: '#/components/schemas/CreateGameRequest'
 *     responses:
 *       200:
 *         description: Game updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 game:
 *                   $ref: '#/components/schemas/Game'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Games]
 *     summary: Delete game
 *     description: Admin only. Removes a game from the catalog.
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
 *         description: Game deleted
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
router.get('/:id', generalLimiter, optionalAuth, getGameById);

router.put(
  '/:id',
  createLimiter,
  authenticate,
  authorizeAdmin,
  [
    body('title')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Title must be at most 255 characters'),
    body('release_status')
      .optional()
      .isIn(['released', 'early_access', 'open_beta', 'closed_beta', 'alpha', 'coming_soon', 'in_development', 'cancelled'])
      .withMessage('Invalid release status'),
    body('availability_status')
      .optional()
      .isIn(['available', 'out_of_catalog', 'expired_license', 'abandonware', 'public_domain', 'discontinued', 'rereleased'])
      .withMessage('Invalid availability status')
  ],
  updateGame
);

router.delete('/:id', generalLimiter, authenticate, authorizeAdmin, deleteGame);

// ─── Release Status per-game routes ───

/**
 * @openapi
 * /games/{id}/status-history:
 *   get:
 *     tags: [Games]
 *     summary: Get status change history for a game
 *     description: Paginated log of release/availability status changes.
 *     parameters:
 *       - in: path
 *         name: id
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
 *         description: Status change history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/status-history', generalLimiter, optionalAuth, getGameStatusHistory);

/**
 * @openapi
 * /games/{id}/countdown:
 *   get:
 *     tags: [Games]
 *     summary: Get countdown info for a game's release
 *     description: Returns days remaining until the game releases.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Countdown info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 countdown:
 *                   type: object
 *                   properties:
 *                     days_remaining:
 *                       type: integer
 *                       example: 42
 *                     release_date:
 *                       type: string
 *                       format: date
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/countdown', generalLimiter, optionalAuth, getGameCountdown);

/**
 * @openapi
 * /games/{id}/status:
 *   put:
 *     tags: [Games]
 *     summary: Change release/availability status
 *     description: Admin only. Updates the release or availability status for a game.
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
 *               release_status:
 *                 type: string
 *                 enum: [released, early_access, open_beta, closed_beta, alpha, coming_soon, in_development, cancelled]
 *               availability_status:
 *                 type: string
 *                 enum: [available, out_of_catalog, expired_license, abandonware, public_domain, discontinued, rereleased]
 *               reason:
 *                 type: string
 *                 description: Reason for status change
 *     responses:
 *       200:
 *         description: Status updated
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
router.put('/:id/status', createLimiter, authenticate, authorizeAdmin, changeGameStatus);

// ─── Game-Platform relationship routes ───

/**
 * @openapi
 * /games/{id}/platforms:
 *   get:
 *     tags: [Games]
 *     summary: Get platforms for a game
 *     description: Returns platform associations with release dates and exclusivity info.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Game platforms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 platforms:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Platform'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   post:
 *     tags: [Games]
 *     summary: Set platform associations for a game
 *     description: Admin only. Replaces all platform associations for a game.
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
 *             required: [platforms]
 *             properties:
 *               platforms:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [platform_id]
 *                   properties:
 *                     platform_id:
 *                       type: integer
 *                       example: 1
 *                     platform_release_date:
 *                       type: string
 *                       format: date
 *                     exclusivity:
 *                       type: string
 *     responses:
 *       200:
 *         description: Platforms set
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
router.get('/:id/platforms', generalLimiter, optionalAuth, getGamePlatforms);

router.post(
  '/:id/platforms',
  createLimiter,
  authenticate,
  authorizeAdmin,
  setGamePlatforms
);

/**
 * @openapi
 * /games/{id}/platforms/{platformId}:
 *   delete:
 *     tags: [Games]
 *     summary: Remove a platform association from a game
 *     description: Admin only.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: platformId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Platform association removed
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
router.delete(
  '/:id/platforms/:platformId',
  generalLimiter,
  authenticate,
  authorizeAdmin,
  removeGamePlatform
);

export default router;
