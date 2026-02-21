import { Router } from 'express';
import { body } from 'express-validator';
import {
    getCollection,
    addToCollection,
    updateCollectionItem,
    removeFromCollection,
    getGameCollectionStatus,
    getCollectionStats
} from '../controllers/collectionController';
import { authenticate, optionalAuth, requireVerified } from '../middlewares/auth';
import { generalLimiter, createLimiter } from '../middlewares/rateLimiter';

const router = Router();

/**
 * @route GET /api/collection/stats
 * @desc Get collection statistics
 * @access Private
 */
router.get('/stats', generalLimiter, authenticate, requireVerified, getCollectionStats);

/**
 * @route GET /api/collection/status/:gameId
 * @desc Get collection status for a specific game
 * @access Private (optional auth returns null if not authenticated)
 */
router.get('/status/:gameId', generalLimiter, authenticate, requireVerified, getGameCollectionStatus);

/**
 * @route GET /api/collection
 * @desc Get user's collection
 * @access Private
 */
router.get('/', generalLimiter, authenticate, requireVerified, getCollection);

/**
 * @route POST /api/collection
 * @desc Add game to collection
 * @access Private
 */
router.post(
    '/',
    createLimiter,
    authenticate,
    requireVerified,
    [
        body('game_id').isInt().withMessage('Valid game_id is required'),
        body('status')
            .optional()
            .isIn(['playing', 'completed', 'paused', 'abandoned', 'not_started', 'wishlist', 'backlog'])
            .withMessage('Invalid status'),
        body('format')
            .optional()
            .isIn(['physical', 'digital'])
            .withMessage('Invalid format')
    ],
    addToCollection
);

/**
 * @route PUT /api/collection/:gameId
 * @desc Update collection item
 * @access Private
 */
router.put(
    '/:gameId',
    createLimiter,
    authenticate,
    requireVerified,
    [
        body('status')
            .optional()
            .isIn(['playing', 'completed', 'paused', 'abandoned', 'not_started', 'wishlist', 'backlog'])
            .withMessage('Invalid status'),
        body('rating')
            .optional()
            .isInt({ min: 1, max: 10 })
            .withMessage('Rating must be between 1 and 10')
    ],
    updateCollectionItem
);

/**
 * @route DELETE /api/collection/:gameId
 * @desc Remove game from collection
 * @access Private
 */
router.delete('/:gameId', generalLimiter, authenticate, requireVerified, removeFromCollection);

export default router;
