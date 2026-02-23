import { Router } from 'express';
import { body } from 'express-validator';
import { getAllUsers, getUserById, updateProfile, deleteUser, getUserStats } from '../controllers/userController';
import { authenticate, authorizeAdmin, requireVerified } from '../middlewares/auth';
import { generalLimiter, createLimiter } from '../middlewares/rateLimiter';

const router = Router();

/**
 * @route GET /api/users/me/stats
 * @desc Get current user statistics (collection, wishlist, etc.)
 * @access Private
 */
router.get('/me/stats', generalLimiter, authenticate, requireVerified, getUserStats);

/**
 * @route GET /api/users
 * @desc Get all users
 * @access Private/Admin
 */
router.get('/', generalLimiter, authenticate, requireVerified, authorizeAdmin, getAllUsers);

/**
 * @route PUT /api/users/me
 * @desc Update current user profile
 * @access Private
 */
router.put(
  '/me',
  createLimiter,
  authenticate,
  requireVerified,
  [
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Bio must be at most 500 characters'),
    body('avatar_url')
      .optional()
      .isURL()
      .withMessage('Avatar URL must be a valid URL')
  ],
  updateProfile
);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Private
 */
router.get('/:id', generalLimiter, authenticate, requireVerified, getUserById);

/**
 * @route DELETE /api/users/:id
 * @desc Delete user
 * @access Private/Admin
 */
router.delete('/:id', generalLimiter, authenticate, requireVerified, authorizeAdmin, deleteUser);

export default router;
