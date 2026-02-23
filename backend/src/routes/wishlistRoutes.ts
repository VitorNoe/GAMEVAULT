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
 * @route POST /api/wishlist/admin/check-releases
 * @desc Trigger wishlist release notification check
 * @access Admin
 */
router.post('/admin/check-releases', generalLimiter, authenticate, authorizeAdmin, triggerWishlistCheck);

/**
 * @route GET /api/wishlist/export
 * @desc Export wishlist as CSV or JSON
 * @access Private
 */
router.get('/export', generalLimiter, authenticate, requireVerified, exportWishlist);

/**
 * @route GET /api/wishlist/check/:gameId
 * @desc Check if a game is in the user's wishlist
 * @access Private
 */
router.get('/check/:gameId', generalLimiter, authenticate, requireVerified, checkWishlistStatus);

/**
 * @route GET /api/wishlist
 * @desc Get user's wishlist
 * @access Private
 */
router.get('/', generalLimiter, authenticate, requireVerified, getWishlist);

/**
 * @route POST /api/wishlist
 * @desc Add game to wishlist
 * @access Private
 */
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
 * @route GET /api/wishlist/:id
 * @desc Get a single wishlist item
 * @access Private
 */
router.get('/:id', generalLimiter, authenticate, requireVerified, getWishlistItem);

/**
 * @route PUT /api/wishlist/:id
 * @desc Update wishlist item
 * @access Private
 */
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

/**
 * @route DELETE /api/wishlist/:id
 * @desc Remove game from wishlist
 * @access Private
 */
router.delete('/:id', generalLimiter, authenticate, requireVerified, removeFromWishlist);

export default router;
