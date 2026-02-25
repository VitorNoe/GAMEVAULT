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
import { validate } from '../middlewares/validate';

const router = Router();

// ─── Static routes (before :id params) ──────────────────────────────

/**
 * @openapi
 * /collection/stats:
 *   get:
 *     tags: [Collection]
 *     summary: Get basic collection stats
 *     description: Returns status distribution (playing, completed, etc.) for the user's collection.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Collection stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stats:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/stats', generalLimiter, authenticate, requireVerified, getCollectionStats);

/**
 * @openapi
 * /collection/statistics:
 *   get:
 *     tags: [Collection]
 *     summary: Comprehensive collection statistics
 *     description: Platform/genre distribution, total value, total hours, and more.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Comprehensive statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statistics:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/statistics', generalLimiter, authenticate, requireVerified, getCollectionStatistics);

/**
 * @openapi
 * /collection/export:
 *   get:
 *     tags: [Collection]
 *     summary: Export collection
 *     description: Export the user's collection as CSV or JSON.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json]
 *           default: json
 *     responses:
 *       200:
 *         description: Exported collection data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/export', generalLimiter, authenticate, requireVerified, exportCollection);

/**
 * @openapi
 * /collection/status/{gameId}:
 *   get:
 *     tags: [Collection]
 *     summary: Get collection status for a game
 *     description: Returns all copies the user owns of the specified game.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Game collection status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CollectionItem'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/status/:gameId', generalLimiter, authenticate, requireVerified, getGameCollectionStatus);

/**
 * @openapi
 * /collection:
 *   get:
 *     tags: [Collection]
 *     summary: Get user's collection
 *     description: Returns the user's game collection with filters, sorting, and pagination.
 *     security:
 *       - BearerAuth: []
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [playing, completed, paused, abandoned, not_started, wishlist, backlog]
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [physical, digital]
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User's collection
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 collection:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CollectionItem'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Collection]
 *     summary: Add game to collection
 *     description: Adds a game to the user's collection. Supports multiple copies per platform.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddToCollectionRequest'
 *     responses:
 *       201:
 *         description: Game added to collection
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 item:
 *                   $ref: '#/components/schemas/CollectionItem'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', generalLimiter, authenticate, requireVerified, getCollection);

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
    validate,
    addToCollection
);

/**
 * @openapi
 * /collection/{id}:
 *   put:
 *     tags: [Collection]
 *     summary: Update collection item
 *     description: Updates status, rating, price, etc. for a collection item.
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
 *               status:
 *                 type: string
 *                 enum: [playing, completed, paused, abandoned, not_started, wishlist, backlog]
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               price_paid:
 *                 type: number
 *                 minimum: 0
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Collection item updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 item:
 *                   $ref: '#/components/schemas/CollectionItem'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Collection]
 *     summary: Remove collection item
 *     description: Removes a game from the user's collection.
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
 *         description: Item removed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
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
    validate,
    updateCollectionItem
);

router.delete('/:id', generalLimiter, authenticate, requireVerified, removeFromCollection);

export default router;
