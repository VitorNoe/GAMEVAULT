import { Router } from 'express';
import {
  createRequest,
  listRequests,
  mostVoted,
  getRequest,
  updateRequest,
  deleteRequest,
  vote,
  unvote,
  fulfill,
  archive,
  changeAvailability,
} from '../controllers/rereleaseController';
import { authenticate, authorizeAdmin, optionalAuth } from '../middlewares/auth';
import { generalLimiter, createLimiter } from '../middlewares/rateLimiter';

const router = Router();

// ─── Admin routes (before parameterized routes) ──────────────────────

/**
 * @openapi
 * /rereleases/admin/{id}/fulfill:
 *   post:
 *     tags: [Re-releases]
 *     summary: Fulfill a re-release request
 *     description: Admin only. Marks a request as fulfilled and notifies all voters.
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
 *         description: Request fulfilled
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
router.post('/admin/:id/fulfill', generalLimiter, authenticate, authorizeAdmin, fulfill);

/**
 * @openapi
 * /rereleases/admin/{id}/archive:
 *   post:
 *     tags: [Re-releases]
 *     summary: Archive a re-release request
 *     description: Admin only. Moves the request to archived status.
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
 *         description: Request archived
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/admin/:id/archive', generalLimiter, authenticate, authorizeAdmin, archive);

/**
 * @openapi
 * /rereleases/admin/games/{gameId}/availability:
 *   put:
 *     tags: [Re-releases]
 *     summary: Update game availability status
 *     description: Admin only. Updates the game's availability and notifies voters.
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
 *             required: [availability_status]
 *             properties:
 *               availability_status:
 *                 type: string
 *                 enum: [available, out_of_catalog, expired_license, abandonware, public_domain, discontinued, rereleased]
 *     responses:
 *       200:
 *         description: Availability updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put('/admin/games/:gameId/availability', generalLimiter, authenticate, authorizeAdmin, changeAvailability);

// ─── Public / Authenticated routes ───────────────────────────────────

/**
 * @openapi
 * /rereleases/most-voted:
 *   get:
 *     tags: [Re-releases]
 *     summary: Get most-voted active re-release requests
 *     description: Returns active requests ranked by vote count.
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Most-voted requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 requests:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RereleaseRequest'
 */
router.get('/most-voted', generalLimiter, mostVoted);

/**
 * @openapi
 * /rereleases:
 *   get:
 *     tags: [Re-releases]
 *     summary: List re-release requests
 *     description: Returns re-release requests with optional status filter and pagination.
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, fulfilled, archived]
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
 *         description: Re-release requests list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 requests:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RereleaseRequest'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *   post:
 *     tags: [Re-releases]
 *     summary: Create a new re-release request
 *     description: Creates a community request for a game to be re-released.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [game_id]
 *             properties:
 *               game_id:
 *                 type: integer
 *                 example: 42
 *               reason:
 *                 type: string
 *                 example: "This classic deserves a modern port"
 *     responses:
 *       201:
 *         description: Request created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', generalLimiter, listRequests);

router.post('/', createLimiter, authenticate, createRequest);

/**
 * @openapi
 * /rereleases/{id}:
 *   get:
 *     tags: [Re-releases]
 *     summary: Get a re-release request by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Request detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 request:
 *                   $ref: '#/components/schemas/RereleaseRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Re-releases]
 *     summary: Update a re-release request
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
 *         description: Request updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   delete:
 *     tags: [Re-releases]
 *     summary: Delete a re-release request
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
 *         description: Request deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/:id', generalLimiter, getRequest);

router.put('/:id', generalLimiter, authenticate, authorizeAdmin, updateRequest);

router.delete('/:id', generalLimiter, authenticate, authorizeAdmin, deleteRequest);

/**
 * @openapi
 * /rereleases/{gameId}/vote:
 *   post:
 *     tags: [Re-releases]
 *     summary: Vote for a re-release
 *     description: Casts a vote (deduplicated per user). Optional comment.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vote cast
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     tags: [Re-releases]
 *     summary: Remove vote from a re-release request
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
 *         description: Vote removed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/:gameId/vote', createLimiter, authenticate, vote);

router.delete('/:gameId/vote', generalLimiter, authenticate, unvote);

export default router;
