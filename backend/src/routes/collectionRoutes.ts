import { Router } from 'express';
import { body } from 'express-validator';
import {
    getCollection,
    addToCollection,
    updateCollectionItem,
    removeFromCollection,
    getGameCollectionStatus,
    getCollectionStats,
    getCollectionStatistics,
    exportCollection,
} from '../controllers/collectionController';
import { authenticate, requireVerified } from '../middlewares/auth';
import { generalLimiter, createLimiter } from '../middlewares/rateLimiter';

const router = Router();

// ─── Static routes (before :id params) ──────────────────────────────

/**
 * @route GET /api/collection/stats
 * @desc Get basic collection stats (status distribution)
 * @access Private
 */
router.get('/stats', generalLimiter, authenticate, requireVerified, getCollectionStats);

/**
 * @route GET /api/collection/statistics
 * @desc Comprehensive collection statistics (platform/genre distribution, value, hours, etc.)
 * @access Private
 */
router.get('/statistics', generalLimiter, authenticate, requireVerified, getCollectionStatistics);

/**
 * @route GET /api/collection/export
 * @desc Export collection as CSV or JSON
 * @access Private
 */
router.get('/export', generalLimiter, authenticate, requireVerified, exportCollection);

/**
 * @route GET /api/collection/status/:gameId
 * @desc Get collection status for a specific game (returns all copies)
 * @access Private
 */
router.get('/status/:gameId', generalLimiter, authenticate, requireVerified, getGameCollectionStatus);

/**
 * @route GET /api/collection
 * @desc Get user's collection with filters, sorting, pagination
 * @access Private
 */
router.get('/', generalLimiter, authenticate, requireVerified, getCollection);

/**
 * @route POST /api/collection
 * @desc Add game to collection (supports multiple copies per platform)
 * @access Private
 */
router.post(
    '/',
    createLimiter,
    authenticate,
    requireVerified,
    [
        body('game_id').isInt().withMessage('Valid game_id is required'),
        body('platform_id').isInt().withMessage('Valid platform_id is required'),
        body('status')
            .optional()
            .isIn(['playing', 'completed', 'paused', 'abandoned', 'not_started', 'wishlist', 'backlog'])
            .withMessage('Invalid status'),
        body('format')
            .optional()
            .isIn(['physical', 'digital'])
            .withMessage('Invalid format'),
        body('rating')
            .optional()
            .isInt({ min: 1, max: 10 })
            .withMessage('Rating must be between 1 and 10'),
        body('price_paid')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Price must be a positive number'),
    ],
    addToCollection
);

/**
 * @route PUT /api/collection/:id
 * @desc Update collection item by ID
 * @access Private
 */
router.put(
    '/:id',
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
            .withMessage('Rating must be between 1 and 10'),
        body('price_paid')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Price must be a positive number'),
    ],
    updateCollectionItem
);

/**
 * @route DELETE /api/collection/:id
 * @desc Remove collection item by ID
 * @access Private
 */
router.delete('/:id', generalLimiter, authenticate, requireVerified, removeFromCollection);

export default router;
