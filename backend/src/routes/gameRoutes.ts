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
  getAbandonwareGames
} from '../controllers/gameController';
import { authenticate, authorizeAdmin, optionalAuth } from '../middlewares/auth';

const router = Router();

/**
 * @route GET /api/games/search
 * @desc Search games
 * @access Public
 */
router.get('/search', optionalAuth, searchGames);

/**
 * @route GET /api/games/upcoming-releases
 * @desc Get upcoming game releases
 * @access Public
 */
router.get('/upcoming-releases', optionalAuth, getUpcomingReleases);

/**
 * @route GET /api/games/abandonware
 * @desc Get abandonware games
 * @access Public
 */
router.get('/abandonware', optionalAuth, getAbandonwareGames);

/**
 * @route GET /api/games
 * @desc Get all games
 * @access Public
 */
router.get('/', optionalAuth, getAllGames);

/**
 * @route GET /api/games/:id
 * @desc Get game by ID
 * @access Public
 */
router.get('/:id', optionalAuth, getGameById);

/**
 * @route POST /api/games
 * @desc Create new game
 * @access Private/Admin
 */
router.post(
  '/',
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
router.delete('/:id', authenticate, authorizeAdmin, deleteGame);

export default router;
