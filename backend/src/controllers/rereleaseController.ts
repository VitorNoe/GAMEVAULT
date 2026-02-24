import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import {
  createRereleaseRequest,
  getRereleaseRequestById,
  listRereleaseRequests,
  updateRereleaseRequest,
  deleteRereleaseRequest,
  voteForRerelease,
  removeVote,
  getMostVotedRequests,
  fulfillRequest,
  archiveRequest,
  updateGameAvailabilityStatus,
} from '../services/rereleaseService';
import {
  getPaginationParams,
  getPaginationResult,
  parseId,
  successResponse,
  errorResponse,
} from '../utils/helpers';

// ─── Re-release Request CRUD ─────────────────────────────────────────

/**
 * Create a re-release request
 * POST /api/rereleases
 */
export const createRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { game_id } = req.body;
    if (!game_id) {
      res.status(400).json(errorResponse('game_id is required'));
      return;
    }

    const request = await createRereleaseRequest(game_id);
    res.status(201).json(successResponse(request, 'Re-release request created'));
  } catch (error: any) {
    console.error('Create rerelease request error:', error);
    const status = error.status || 500;
    res.status(status).json(errorResponse(error.message || 'Error creating re-release request'));
  }
};

/**
 * List re-release requests (with optional status filter)
 * GET /api/rereleases
 */
export const listRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationParams(req);
    const status = req.query.status as string | undefined;

    const { rows, count } = await listRereleaseRequests({ status, page, limit, offset });
    const pagination = getPaginationResult(count, page, limit);

    res.json(successResponse({ items: rows, pagination }));
  } catch (error: any) {
    console.error('List rerelease requests error:', error);
    res.status(500).json(errorResponse('Error listing re-release requests'));
  }
};

/**
 * Get most-voted re-release requests
 * GET /api/rereleases/most-voted
 */
export const mostVoted = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const requests = await getMostVotedRequests(limit);
    res.json(successResponse(requests));
  } catch (error: any) {
    console.error('Most voted rerelease error:', error);
    res.status(500).json(errorResponse('Error fetching most-voted re-release requests'));
  }
};

/**
 * Get a single re-release request by ID
 * GET /api/rereleases/:id
 */
export const getRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json(errorResponse('Invalid request ID'));
      return;
    }

    const request = await getRereleaseRequestById(id);
    if (!request) {
      res.status(404).json(errorResponse('Re-release request not found'));
      return;
    }

    res.json(successResponse(request));
  } catch (error: any) {
    console.error('Get rerelease request error:', error);
    res.status(500).json(errorResponse('Error fetching re-release request'));
  }
};

/**
 * Update a re-release request (admin only)
 * PUT /api/rereleases/:id
 */
export const updateRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json(errorResponse('Invalid request ID'));
      return;
    }

    const { status, fulfilled_date } = req.body;

    if (status) {
      const validStatuses = ['active', 'fulfilled', 'archived'];
      if (!validStatuses.includes(status)) {
        res.status(400).json(errorResponse(`status must be one of: ${validStatuses.join(', ')}`));
        return;
      }
    }

    const updated = await updateRereleaseRequest(id, { status, fulfilled_date });
    if (!updated) {
      res.status(404).json(errorResponse('Re-release request not found'));
      return;
    }

    res.json(successResponse(updated, 'Re-release request updated'));
  } catch (error: any) {
    console.error('Update rerelease request error:', error);
    res.status(500).json(errorResponse('Error updating re-release request'));
  }
};

/**
 * Delete a re-release request (admin only)
 * DELETE /api/rereleases/:id
 */
export const deleteRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json(errorResponse('Invalid request ID'));
      return;
    }

    const deleted = await deleteRereleaseRequest(id);
    if (!deleted) {
      res.status(404).json(errorResponse('Re-release request not found'));
      return;
    }

    res.json(successResponse(null, 'Re-release request deleted'));
  } catch (error: any) {
    console.error('Delete rerelease request error:', error);
    res.status(500).json(errorResponse('Error deleting re-release request'));
  }
};

// ─── Voting ──────────────────────────────────────────────────────────

/**
 * Vote for a re-release (with deduplication per user, optional comment)
 * POST /api/rereleases/:gameId/vote
 */
export const vote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json(errorResponse('Not authenticated'));
      return;
    }

    const gameId = parseId(req.params.gameId);
    if (!gameId) {
      res.status(400).json(errorResponse('Invalid game ID'));
      return;
    }

    const { comment } = req.body;
    const { vote: voteRecord, created } = await voteForRerelease(gameId, userId, comment);

    if (created) {
      res.status(201).json(successResponse(voteRecord, 'Vote registered successfully'));
    } else {
      res.json(successResponse(voteRecord, 'Vote already exists (comment updated if provided)'));
    }
  } catch (error: any) {
    console.error('Vote rerelease error:', error);
    const status = error.status || 500;
    res.status(status).json(errorResponse(error.message || 'Error voting for re-release'));
  }
};

/**
 * Remove own vote
 * DELETE /api/rereleases/:gameId/vote
 */
export const unvote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json(errorResponse('Not authenticated'));
      return;
    }

    const gameId = parseId(req.params.gameId);
    if (!gameId) {
      res.status(400).json(errorResponse('Invalid game ID'));
      return;
    }

    const removed = await removeVote(gameId, userId);
    if (!removed) {
      res.status(404).json(errorResponse('No vote found for this game'));
      return;
    }

    res.json(successResponse(null, 'Vote removed'));
  } catch (error: any) {
    console.error('Unvote rerelease error:', error);
    res.status(500).json(errorResponse('Error removing vote'));
  }
};

// ─── Admin: Fulfill / Archive / Availability ─────────────────────────

/**
 * Fulfill a re-release request and notify all voters
 * POST /api/rereleases/admin/:id/fulfill
 */
export const fulfill = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json(errorResponse('Invalid request ID'));
      return;
    }

    const adminId = req.user!.id;
    const request = await fulfillRequest(id, adminId);
    res.json(successResponse(request, 'Re-release request fulfilled and voters notified'));
  } catch (error: any) {
    console.error('Fulfill rerelease error:', error);
    const status = error.status || 500;
    res.status(status).json(errorResponse(error.message || 'Error fulfilling re-release request'));
  }
};

/**
 * Archive a re-release request
 * POST /api/rereleases/admin/:id/archive
 */
export const archive = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json(errorResponse('Invalid request ID'));
      return;
    }

    const request = await archiveRequest(id);
    res.json(successResponse(request, 'Re-release request archived'));
  } catch (error: any) {
    console.error('Archive rerelease error:', error);
    const status = error.status || 500;
    res.status(status).json(errorResponse(error.message || 'Error archiving re-release request'));
  }
};

/**
 * Admin: update game availability status (notifies voters if game becomes available)
 * PUT /api/rereleases/admin/games/:gameId/availability
 */
export const changeAvailability = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const gameId = parseId(req.params.gameId);
    if (!gameId) {
      res.status(400).json(errorResponse('Invalid game ID'));
      return;
    }

    const { availability_status } = req.body;
    if (!availability_status) {
      res.status(400).json(errorResponse('availability_status is required'));
      return;
    }

    const validStatuses = ['available', 'delisted', 'region_locked', 'discontinued', 'limited'];
    if (!validStatuses.includes(availability_status)) {
      res.status(400).json(errorResponse(`availability_status must be one of: ${validStatuses.join(', ')}`));
      return;
    }

    const adminId = req.user!.id;
    const game = await updateGameAvailabilityStatus(gameId, availability_status, adminId);
    res.json(successResponse(game, 'Game availability updated'));
  } catch (error: any) {
    console.error('Change availability error:', error);
    const status = error.status || 500;
    res.status(status).json(errorResponse(error.message || 'Error updating game availability'));
  }
};
