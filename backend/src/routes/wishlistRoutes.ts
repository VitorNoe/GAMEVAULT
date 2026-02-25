import { Router } from 'express';
import { body } from 'express-validator';
import {
    getWishlist,
    addToWishlist,
    updateWishlistItem,
    removeFromWishlist,
    getWishlistItem,
    checkWishlistStatus,
    triggerWishlistCheck,
    exportWishlist,
} from '../controllers/wishlistController';
import { authenticate, authorizeAdmin, requireVerified } from '../middlewares/auth';
import { generalLimiter, createLimiter } from '../middlewares/rateLimiter';

const router = Router();

// ─── Static routes first ─────────────────────────────────────────────

/**
 * @openapi
 * /wishlist/admin/check-releases:
 *   post:
 *     tags: [Wishlist]
 *     summary: Trigger wishlist release notification check
 *     description: Admin only. Checks for newly released wishlist games and sends notifications.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Check triggered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/admin/check-releases', generalLimiter, authenticate, authorizeAdmin, triggerWishlistCheck);

/**
 * @openapi
 * /wishlist/export:
 *   get:
 *     tags: [Wishlist]
 *     summary: Export wishlist
 *     description: Export the user's wishlist as CSV or JSON.
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
 *         description: Exported wishlist data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/export', generalLimiter, authenticate, requireVerified, exportWishlist);

/**
 * @openapi
 * /wishlist/check/{gameId}:
 *   get:
 *     tags: [Wishlist]
 *     summary: Check if a game is in wishlist
 *     description: Returns whether the specified game is on the user's wishlist.
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
 *         description: Wishlist status check
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 in_wishlist:
 *                   type: boolean
 *                   example: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/check/:gameId', generalLimiter, authenticate, requireVerified, checkWishlistStatus);

/**
 * @openapi
 * /wishlist:
 *   get:
 *     tags: [Wishlist]
 *     summary: Get user's wishlist
 *     description: Returns the user's wishlist with pagination.
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
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [high, medium, low]
 *     responses:
 *       200:
 *         description: User's wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 wishlist:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WishlistItem'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Wishlist]
 *     summary: Add game to wishlist
 *     description: Adds a game to the user's wishlist with optional priority and max price.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddToWishlistRequest'
 *     responses:
 *       201:
 *         description: Game added to wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 item:
 *                   $ref: '#/components/schemas/WishlistItem'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', generalLimiter, authenticate, requireVerified, getWishlist);

router.post(
    '/',
    createLimiter,
    authenticate,
    requireVerified,
    [
        body('game_id').isInt().withMessage('Valid game_id is required'),
        body('priority')
            .optional()
            .isIn(['high', 'medium', 'low'])
            .withMessage('Priority must be high, medium, or low'),
        body('max_price')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Max price must be a positive number'),
    ],
    addToWishlist
);

/**
 * @openapi
 * /wishlist/{id}:
 *   get:
 *     tags: [Wishlist]
 *     summary: Get a single wishlist item
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
 *         description: Wishlist item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 item:
 *                   $ref: '#/components/schemas/WishlistItem'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Wishlist]
 *     summary: Update wishlist item
 *     description: Update priority and/or max price.
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
 *               priority:
 *                 type: string
 *                 enum: [high, medium, low]
 *               max_price:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Wishlist item updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Wishlist]
 *     summary: Remove game from wishlist
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
router.get('/:id', generalLimiter, authenticate, requireVerified, getWishlistItem);

router.put(
    '/:id',
    createLimiter,
    authenticate,
    requireVerified,
    [
        body('priority')
            .optional()
            .isIn(['high', 'medium', 'low'])
            .withMessage('Priority must be high, medium, or low'),
        body('max_price')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Max price must be a positive number'),
    ],
    updateWishlistItem
);

router.delete('/:id', generalLimiter, authenticate, requireVerified, removeFromWishlist);

export default router;
