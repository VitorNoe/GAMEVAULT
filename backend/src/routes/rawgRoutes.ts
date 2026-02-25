import { Router } from 'express';
import {
  rawgSearch,
  rawgLookup,
  rawgImport,
  rawgSyncOne,
} from '../controllers/rawgController';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import { generalLimiter, createLimiter } from '../middlewares/rateLimiter';

const router = Router();

/**
 * @openapi
 * /external/rawg/search:
 *   get:
 *     tags: [RAWG]
 *     summary: Search RAWG API for games
 *     description: Admin only. Proxies a search to the RAWG API with server-side caching.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: RAWG search results
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/search', generalLimiter, authenticate, authorizeAdmin, rawgSearch);

/**
 * @openapi
 * /external/rawg/lookup/{rawgId}:
 *   get:
 *     tags: [RAWG]
 *     summary: Preview RAWG game details
 *     description: Admin only. Fetches full game details from RAWG before import.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rawgId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: RAWG game details
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/lookup/:rawgId', generalLimiter, authenticate, authorizeAdmin, rawgLookup);

/**
 * @openapi
 * /external/rawg/import/{rawgId}:
 *   post:
 *     tags: [RAWG]
 *     summary: Import a RAWG game into local database
 *     description: Admin only. Imports a game from RAWG and creates a local catalog entry.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rawgId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Game imported
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 game:
 *                   $ref: '#/components/schemas/Game'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/import/:rawgId', createLimiter, authenticate, authorizeAdmin, rawgImport);

/**
 * @openapi
 * /external/rawg/sync/{gameId}:
 *   post:
 *     tags: [RAWG]
 *     summary: Re-sync a local game with RAWG data
 *     description: Admin only. Re-fetches and updates local game data from RAWG.
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
 *         description: Game re-synced
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 game:
 *                   $ref: '#/components/schemas/Game'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/sync/:gameId', createLimiter, authenticate, authorizeAdmin, rawgSyncOne);

export default router;
