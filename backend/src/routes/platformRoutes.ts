import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllPlatforms,
  getPlatformById,
  createPlatform,
  updatePlatform,
  deletePlatform,
  getPlatformGames,
} from '../controllers/platformController';
import { authenticate, authorizeAdmin, optionalAuth } from '../middlewares/auth';
import { generalLimiter, createLimiter } from '../middlewares/rateLimiter';
import { validate } from '../middlewares/validate';

const router = Router();

/**
 * @openapi
 * /platforms:
 *   get:
 *     tags: [Platforms]
 *     summary: Get all platforms
 *     description: Returns all gaming platforms. Pass `?all=true` for an unpaginated list (dropdown use).
 *     parameters:
 *       - in: query
 *         name: all
 *         schema:
 *           type: boolean
 *         description: Return all platforms without pagination
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
 *     responses:
 *       200:
 *         description: List of platforms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 platforms:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Platform'
 *   post:
 *     tags: [Platforms]
 *     summary: Create a new platform
 *     description: Admin only. Creates a new gaming platform entry.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePlatformRequest'
 *     responses:
 *       201:
 *         description: Platform created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 platform:
 *                   $ref: '#/components/schemas/Platform'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', generalLimiter, optionalAuth, getAllPlatforms);

router.post(
  '/',
  createLimiter,
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
  validate,
  createPlatform
);

/**
 * @openapi
 * /platforms/{id}:
 *   get:
 *     tags: [Platforms]
 *     summary: Get platform by ID
 *     description: Returns a single platform including game count.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Platform detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 platform:
 *                   $ref: '#/components/schemas/Platform'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Platforms]
 *     summary: Update platform
 *     description: Admin only.
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
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               type:
 *                 type: string
 *                 enum: [console, handheld, pc, mobile]
 *               manufacturer:
 *                 type: string
 *               release_year:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Platform updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 platform:
 *                   $ref: '#/components/schemas/Platform'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Platforms]
 *     summary: Delete platform
 *     description: Admin only. Fails if games are associated.
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
 *         description: Platform deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', generalLimiter, optionalAuth, getPlatformById);

/**
 * @openapi
 * /platforms/{id}/games:
 *   get:
 *     tags: [Platforms]
 *     summary: Get games for a platform
 *     description: Returns games associated with a platform including platform-specific release info.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *     responses:
 *       200:
 *         description: Games for the platform
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 games:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Game'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/games', generalLimiter, optionalAuth, getPlatformGames);

router.put(
  '/:id',
  createLimiter,
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
  validate,
  updatePlatform
);

router.delete('/:id', generalLimiter, authenticate, authorizeAdmin, deletePlatform);

export default router;
