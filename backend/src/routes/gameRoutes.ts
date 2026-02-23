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
import { authenticate, authorizeAdmin, optionalAuth } from '../middlewares/auth';
import { generalLimiter, createLimiter } from '../middlewares/rateLimiter';

const router = Router();

/**
 * @route GET /api/games/search
 * @desc Search games
 * @access Public
 */
router.get('/search', generalLimiter, optionalAuth, searchGames);

/**
 * @route GET /api/games/upcoming-releases
 * @desc Get upcoming game releases (auto-detects based on system date)
 * @access Public
 */
router.get('/upcoming-releases', generalLimiter, optionalAuth, getUpcomingReleases);

/**
 * @route GET /api/games/abandonware
 * @desc Get abandonware games
 * @access Public
 */
router.get('/abandonware', generalLimiter, optionalAuth, getAbandonwareGames);

/**
 * @route GET /api/games/goty
 * @desc Get Game of the Year tagged games
 * @access Public
 */
router.get('/goty', generalLimiter, optionalAuth, getGotyGames);

/**
 * @route GET /api/games
 * @desc Get all games
 * @access Public
 */
router.get('/', generalLimiter, optionalAuth, getAllGames);

/**
 * @route GET /api/games/:id
 * @desc Get game by ID
 * @access Public
 */
router.get('/:id', generalLimiter, optionalAuth, getGameById);

/**
 * @route POST /api/games
 * @desc Create new game
 * @access Private/Admin
 */
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
 * @route PUT /api/games/:id
 * @desc Update game
 * @access Private/Admin
 */
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

/**
 * @route DELETE /api/games/:id
 * @desc Delete game
 * @access Private/Admin
 */
router.delete('/:id', generalLimiter, authenticate, authorizeAdmin, deleteGame);

// ─── Game-Platform relationship routes ───

/**
 * @route GET /api/games/:id/platforms
 * @desc Get platforms for a game with release dates and exclusivity
 * @access Public
 */
router.get('/:id/platforms', generalLimiter, optionalAuth, getGamePlatforms);

/**
 * @route POST /api/games/:id/platforms
 * @desc Set/replace all platform associations for a game
 * @body { platforms: [{ platform_id, platform_release_date?, exclusivity? }] }
 * @access Private/Admin
 */
router.post(
  '/:id/platforms',
  createLimiter,
  authenticate,
  authorizeAdmin,
  setGamePlatforms
);

/**
 * @route DELETE /api/games/:id/platforms/:platformId
 * @desc Remove a single platform association from a game
 * @access Private/Admin
 */
router.delete(
  '/:id/platforms/:platformId',
  generalLimiter,
  authenticate,
  authorizeAdmin,
  removeGamePlatform
);

export default router;
