import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllPlatforms,
  getPlatformById,
  createPlatform,
  updatePlatform,
  deletePlatform
} from '../controllers/platformController';
import { authenticate, authorizeAdmin, optionalAuth } from '../middlewares/auth';

const router = Router();

/**
 * @route GET /api/platforms
 * @desc Get all platforms
 * @access Public
 */
router.get('/', optionalAuth, getAllPlatforms);

/**
 * @route GET /api/platforms/:id
 * @desc Get platform by ID
 * @access Public
 */
router.get('/:id', optionalAuth, getPlatformById);

/**
 * @route POST /api/platforms
 * @desc Create new platform
 * @access Private/Admin
 */
router.post(
  '/',
  authenticate,
  authorizeAdmin,
  [
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 100 })
      .withMessage('Name must be at most 100 characters'),
    body('slug')
      .notEmpty()
      .withMessage('Slug is required')
      .isSlug()
      .withMessage('Slug must be a valid URL slug')
      .isLength({ max: 100 })
      .withMessage('Slug must be at most 100 characters'),
    body('type')
      .notEmpty()
      .withMessage('Type is required')
      .isIn(['console', 'handheld', 'pc', 'mobile'])
      .withMessage('Type must be one of: console, handheld, pc, mobile')
  ],
  createPlatform
);

/**
 * @route PUT /api/platforms/:id
 * @desc Update platform
 * @access Private/Admin
 */
router.put(
  '/:id',
  authenticate,
  authorizeAdmin,
  [
    body('name')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Name must be at most 100 characters'),
    body('type')
      .optional()
      .isIn(['console', 'handheld', 'pc', 'mobile'])
      .withMessage('Type must be one of: console, handheld, pc, mobile')
  ],
  updatePlatform
);

/**
 * @route DELETE /api/platforms/:id
 * @desc Delete platform
 * @access Private/Admin
 */
router.delete('/:id', authenticate, authorizeAdmin, deletePlatform);

export default router;
