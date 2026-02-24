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

const router = Router();

// ─── Preservation Sources ────────────────────────────────────────────

/**
 * @route GET /api/preservation/sources
 * @desc List all preservation sources (museums, archives, organizations)
 * @access Public
 */
router.get('/sources', generalLimiter, listSources);

/**
 * @route GET /api/preservation/sources/:id
 * @desc Get a preservation source with its preserved games
 * @access Public
 */
router.get('/sources/:id', generalLimiter, getSource);

/**
 * @route POST /api/preservation/sources
 * @desc Create a new preservation source
 * @access Admin
 */
router.post('/sources', createLimiter, authenticate, authorizeAdmin, createSource);

/**
 * @route PUT /api/preservation/sources/:id
 * @desc Update a preservation source
 * @access Admin
 */
router.put('/sources/:id', generalLimiter, authenticate, authorizeAdmin, updateSource);

/**
 * @route DELETE /api/preservation/sources/:id
 * @desc Delete a preservation source
 * @access Admin
 */
router.delete('/sources/:id', generalLimiter, authenticate, authorizeAdmin, removeSource);

// ─── Game ↔ Preservation links ───────────────────────────────────────

/**
 * @route GET /api/preservation/games/:gameId
 * @desc Get preservation info for a game (museum UI hook)
 * @access Public
 */
router.get('/games/:gameId', generalLimiter, getGamePreservationInfo);

/**
 * @route POST /api/preservation/games/:gameId/sources
 * @desc Link a game to a preservation source
 * @access Admin
 */
router.post('/games/:gameId/sources', createLimiter, authenticate, authorizeAdmin, linkGame);

/**
 * @route DELETE /api/preservation/games/:gameId/sources/:sourceId
 * @desc Unlink a game from a preservation source
 * @access Admin
 */
router.delete('/games/:gameId/sources/:sourceId', generalLimiter, authenticate, authorizeAdmin, unlinkGame);

export default router;
