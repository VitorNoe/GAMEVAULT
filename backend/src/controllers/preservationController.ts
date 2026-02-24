import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import {
  listPreservationSources,
  getPreservationSourceById,
  createPreservationSource,
  updatePreservationSource,
  deletePreservationSource,
  getGamePreservation,
  linkGameToPreservationSource,
  unlinkGameFromPreservationSource,
} from '../services/preservationService';
import { parseId, successResponse, errorResponse } from '../utils/helpers';

// ─── Preservation Sources CRUD ───────────────────────────────────────

/**
 * List all preservation sources
 * GET /api/preservation/sources
 */
export const listSources = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const source_type = req.query.source_type as string | undefined;
    const search = req.query.search as string | undefined;

    const sources = await listPreservationSources({ source_type, search });
    res.json(successResponse(sources));
  } catch (error: any) {
    console.error('List preservation sources error:', error);
    res.status(500).json(errorResponse('Error listing preservation sources'));
  }
};

/**
 * Get a single preservation source by ID
 * GET /api/preservation/sources/:id
 */
export const getSource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json(errorResponse('Invalid source ID'));
      return;
    }

    const source = await getPreservationSourceById(id);
    if (!source) {
      res.status(404).json(errorResponse('Preservation source not found'));
      return;
    }

    res.json(successResponse(source));
  } catch (error: any) {
    console.error('Get preservation source error:', error);
    res.status(500).json(errorResponse('Error fetching preservation source'));
  }
};

/**
 * Create a preservation source (admin only)
 * POST /api/preservation/sources
 */
export const createSource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, slug, url, source_type, logo_url, description } = req.body;

    if (!name || !slug || !url || !source_type) {
      res.status(400).json(errorResponse('name, slug, url, and source_type are required'));
      return;
    }

    const validTypes = ['museum', 'archive', 'organization'];
    if (!validTypes.includes(source_type)) {
      res.status(400).json(errorResponse(`source_type must be one of: ${validTypes.join(', ')}`));
      return;
    }

    const source = await createPreservationSource({ name, slug, url, source_type, logo_url, description });
    res.status(201).json(successResponse(source, 'Preservation source created'));
  } catch (error: any) {
    console.error('Create preservation source error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json(errorResponse('A preservation source with this slug already exists'));
      return;
    }
    res.status(500).json(errorResponse('Error creating preservation source'));
  }
};

/**
 * Update a preservation source (admin only)
 * PUT /api/preservation/sources/:id
 */
export const updateSource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json(errorResponse('Invalid source ID'));
      return;
    }

    const { name, slug, url, source_type, logo_url, description } = req.body;

    if (source_type) {
      const validTypes = ['museum', 'archive', 'organization'];
      if (!validTypes.includes(source_type)) {
        res.status(400).json(errorResponse(`source_type must be one of: ${validTypes.join(', ')}`));
        return;
      }
    }

    const updated = await updatePreservationSource(id, { name, slug, url, source_type, logo_url, description });
    if (!updated) {
      res.status(404).json(errorResponse('Preservation source not found'));
      return;
    }

    res.json(successResponse(updated, 'Preservation source updated'));
  } catch (error: any) {
    console.error('Update preservation source error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json(errorResponse('A preservation source with this slug already exists'));
      return;
    }
    res.status(500).json(errorResponse('Error updating preservation source'));
  }
};

/**
 * Delete a preservation source (admin only)
 * DELETE /api/preservation/sources/:id
 */
export const removeSource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json(errorResponse('Invalid source ID'));
      return;
    }

    const deleted = await deletePreservationSource(id);
    if (!deleted) {
      res.status(404).json(errorResponse('Preservation source not found'));
      return;
    }

    res.json(successResponse(null, 'Preservation source deleted'));
  } catch (error: any) {
    console.error('Delete preservation source error:', error);
    res.status(500).json(errorResponse('Error deleting preservation source'));
  }
};

// ─── Game ↔ Preservation links ───────────────────────────────────────

/**
 * Get preservation info for a game
 * GET /api/preservation/games/:gameId
 */
export const getGamePreservationInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const gameId = parseId(req.params.gameId);
    if (!gameId) {
      res.status(400).json(errorResponse('Invalid game ID'));
      return;
    }

    const links = await getGamePreservation(gameId);
    res.json(successResponse(links));
  } catch (error: any) {
    console.error('Get game preservation error:', error);
    res.status(500).json(errorResponse('Error fetching game preservation info'));
  }
};

/**
 * Link a game to a preservation source (admin only)
 * POST /api/preservation/games/:gameId/sources
 */
export const linkGame = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const gameId = parseId(req.params.gameId);
    if (!gameId) {
      res.status(400).json(errorResponse('Invalid game ID'));
      return;
    }

    const { source_id, available, specific_url, notes } = req.body;
    if (!source_id) {
      res.status(400).json(errorResponse('source_id is required'));
      return;
    }

    const link = await linkGameToPreservationSource({
      game_id: gameId,
      source_id,
      available,
      specific_url,
      notes,
    });

    res.status(201).json(successResponse(link, 'Game linked to preservation source'));
  } catch (error: any) {
    console.error('Link game to preservation error:', error);
    res.status(500).json(errorResponse('Error linking game to preservation source'));
  }
};

/**
 * Unlink a game from a preservation source (admin only)
 * DELETE /api/preservation/games/:gameId/sources/:sourceId
 */
export const unlinkGame = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const gameId = parseId(req.params.gameId);
    const sourceId = parseId(req.params.sourceId);
    if (!gameId || !sourceId) {
      res.status(400).json(errorResponse('Invalid game ID or source ID'));
      return;
    }

    const deleted = await unlinkGameFromPreservationSource(gameId, sourceId);
    if (!deleted) {
      res.status(404).json(errorResponse('Link not found'));
      return;
    }

    res.json(successResponse(null, 'Game unlinked from preservation source'));
  } catch (error: any) {
    console.error('Unlink game from preservation error:', error);
    res.status(500).json(errorResponse('Error unlinking game from preservation source'));
  }
};
