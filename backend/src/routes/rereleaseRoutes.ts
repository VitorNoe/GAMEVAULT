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
 * @route POST /api/rereleases/admin/:id/fulfill
 * @desc Fulfill a re-release request and notify all voters
 * @access Admin
 */
router.post('/admin/:id/fulfill', generalLimiter, authenticate, authorizeAdmin, fulfill);

/**
 * @route POST /api/rereleases/admin/:id/archive
 * @desc Archive a re-release request
 * @access Admin
 */
router.post('/admin/:id/archive', generalLimiter, authenticate, authorizeAdmin, archive);

/**
 * @route PUT /api/rereleases/admin/games/:gameId/availability
 * @desc Update game availability status and notify voters
 * @access Admin
 */
router.put('/admin/games/:gameId/availability', generalLimiter, authenticate, authorizeAdmin, changeAvailability);

// ─── Public / Authenticated routes ───────────────────────────────────

/**
 * @route GET /api/rereleases/most-voted
 * @desc Get most-voted active re-release requests (ranked)
 * @access Public
 */
router.get('/most-voted', generalLimiter, mostVoted);

/**
 * @route GET /api/rereleases
 * @desc List re-release requests (with optional status filter and pagination)
 * @access Public
 */
router.get('/', generalLimiter, listRequests);

/**
 * @route POST /api/rereleases
 * @desc Create a new re-release request
 * @access Private
 */
router.post('/', createLimiter, authenticate, createRequest);

/**
 * @route GET /api/rereleases/:id
 * @desc Get a single re-release request by ID
 * @access Public
 */
router.get('/:id', generalLimiter, getRequest);

/**
 * @route PUT /api/rereleases/:id
 * @desc Update a re-release request (admin only)
 * @access Admin
 */
router.put('/:id', generalLimiter, authenticate, authorizeAdmin, updateRequest);

/**
 * @route DELETE /api/rereleases/:id
 * @desc Delete a re-release request (admin only)
 * @access Admin
 */
router.delete('/:id', generalLimiter, authenticate, authorizeAdmin, deleteRequest);

/**
 * @route POST /api/rereleases/:gameId/vote
 * @desc Vote for a re-release (with deduplication per user, optional comment)
 * @access Private
 */
router.post('/:gameId/vote', createLimiter, authenticate, vote);

/**
 * @route DELETE /api/rereleases/:gameId/vote
 * @desc Remove own vote from a re-release request
 * @access Private
 */
router.delete('/:gameId/vote', generalLimiter, authenticate, unvote);

export default router;
