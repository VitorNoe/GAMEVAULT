import { Router } from 'express';
import {
  listSources,
  getSource,
  createSource,
  updateSource,
  removeSource,
  getGamePreservationInfo,
  linkGame,
  unlinkGame,
} from '../controllers/preservationController';
import { authenticate, authorizeAdmin, optionalAuth } from '../middlewares/auth';
import { generalLimiter, createLimiter } from '../middlewares/rateLimiter';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate';

const router = Router();

// ─── Preservation Sources ────────────────────────────────────────────

/**
 * @openapi
 * /preservation/sources:
 *   get:
 *     tags: [Preservation]
 *     summary: List all preservation sources
 *     description: Returns museums, archives, and organizations involved in game preservation.
 *     responses:
 *       200:
 *         description: Preservation sources
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 sources:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PreservationSource'
 *   post:
 *     tags: [Preservation]
 *     summary: Create a preservation source
 *     description: Admin only. Creates a new preservation source entry.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Internet Archive
 *               type:
 *                 type: string
 *                 example: archive
 *               url:
 *                 type: string
 *                 format: uri
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Source created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/sources', generalLimiter, listSources);

router.post(
  '/sources',
  createLimiter,
  authenticate,
  authorizeAdmin,
  [
    body('name').notEmpty().withMessage('Name is required').isLength({ max: 255 }).withMessage('Name must be at most 255 characters'),
    body('type').notEmpty().withMessage('Type is required').isLength({ max: 100 }).withMessage('Type must be at most 100 characters'),
    body('url').optional().isURL().withMessage('URL must be a valid URL'),
    body('description').optional().isLength({ max: 2000 }).withMessage('Description must be at most 2000 characters'),
  ],
  validate,
  createSource
);

/**
 * @openapi
 * /preservation/sources/{id}:
 *   get:
 *     tags: [Preservation]
 *     summary: Get a preservation source
 *     description: Returns a source with its preserved games list.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Source detail with games
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Preservation]
 *     summary: Update a preservation source
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
 *               type:
 *                 type: string
 *               url:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Source updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Preservation]
 *     summary: Delete a preservation source
 *     description: Admin only.
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
 *         description: Source deleted
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
router.get('/sources/:id', generalLimiter, getSource);

router.put(
  '/sources/:id',
  generalLimiter,
  authenticate,
  authorizeAdmin,
  [
    body('name').optional().isLength({ max: 255 }).withMessage('Name must be at most 255 characters'),
    body('type').optional().isLength({ max: 100 }).withMessage('Type must be at most 100 characters'),
    body('url').optional().isURL().withMessage('URL must be a valid URL'),
    body('description').optional().isLength({ max: 2000 }).withMessage('Description must be at most 2000 characters'),
  ],
  validate,
  updateSource
);

router.delete('/sources/:id', generalLimiter, authenticate, authorizeAdmin, removeSource);

// ─── Game ↔ Preservation links ───────────────────────────────────────

/**
 * @openapi
 * /preservation/games/{gameId}:
 *   get:
 *     tags: [Preservation]
 *     summary: Get preservation info for a game
 *     description: Returns all preservation sources linked to a game (museum UI hook).
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Preservation info
 */
router.get('/games/:gameId', generalLimiter, getGamePreservationInfo);

/**
 * @openapi
 * /preservation/games/{gameId}/sources:
 *   post:
 *     tags: [Preservation]
 *     summary: Link a game to a preservation source
 *     description: Admin only.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [source_id]
 *             properties:
 *               source_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Game linked to source
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  '/games/:gameId/sources',
  createLimiter,
  authenticate,
  authorizeAdmin,
  [
    body('source_id').isInt({ min: 1 }).withMessage('Valid source_id is required'),
  ],
  validate,
  linkGame
);

/**
 * @openapi
 * /preservation/games/{gameId}/sources/{sourceId}:
 *   delete:
 *     tags: [Preservation]
 *     summary: Unlink a game from a preservation source
 *     description: Admin only.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: sourceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Link removed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete('/games/:gameId/sources/:sourceId', generalLimiter, authenticate, authorizeAdmin, unlinkGame);

export default router;
