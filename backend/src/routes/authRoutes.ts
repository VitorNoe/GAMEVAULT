import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, logout, getMe } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';
import { authLimiter, generalLimiter } from '../middlewares/rateLimiter';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  authLimiter,
  [
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  register
);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post(
  '/login',
  authLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  login
);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Public
 */
router.post('/logout', logout);

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', generalLimiter, authenticate, getMe);

export default router;