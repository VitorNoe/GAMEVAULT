import { Router } from 'express';
import { body } from 'express-validator';
import { getAllUsers, getUserById, updateProfile, deleteUser } from '../controllers/userController';
import { authenticate, authorizeAdmin } from '../middlewares/auth';

const router = Router();

/**
 * @route GET /api/users
 * @desc Get all users
 * @access Private/Admin
 */
router.get('/', authenticate, authorizeAdmin, getAllUsers);

/**
 * @route GET /api/users/me
 * @desc Update current user profile
 * @access Private
 */
router.put(
  '/me',
  authenticate,
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
router.get('/:id', authenticate, getUserById);

/**
 * @route DELETE /api/users/:id
 * @desc Delete user
 * @access Private/Admin
 */
router.delete('/:id', authenticate, authorizeAdmin, deleteUser);

export default router;
