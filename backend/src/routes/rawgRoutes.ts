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
 * @route GET /api/external/rawg/search?q=...&page=...&page_size=...
 * @desc Search RAWG API for games (with caching)
 * @access Private/Admin
 */
router.get('/search', generalLimiter, authenticate, authorizeAdmin, rawgSearch);

/**
 * @route GET /api/external/rawg/lookup/:rawgId
 * @desc Preview RAWG game details before import
 * @access Private/Admin
 */
router.get('/lookup/:rawgId', generalLimiter, authenticate, authorizeAdmin, rawgLookup);

/**
 * @route POST /api/external/rawg/import/:rawgId
 * @desc Import a RAWG game into local database
 * @access Private/Admin
 */
router.post('/import/:rawgId', createLimiter, authenticate, authorizeAdmin, rawgImport);

/**
 * @route POST /api/external/rawg/sync/:gameId
 * @desc Re-sync a local game with its RAWG data
 * @access Private/Admin
 */
router.post('/sync/:gameId', createLimiter, authenticate, authorizeAdmin, rawgSyncOne);

export default router;
