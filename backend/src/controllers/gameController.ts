import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Game from '../models/Game';

/**
 * Get all games with pagination and filters
 * GET /api/games
 */
export const getAllGames = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      release_status,
      availability_status,
      year
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }

    if (release_status) {
      where.release_status = release_status;
    }

    if (availability_status) {
      where.availability_status = availability_status;
    }

    if (year) {
      where.release_year = parseInt(year as string);
    }

    const { count, rows: games } = await Game.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        games,
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(count / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get all games error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching games.'
    });
  }
};

/**
 * Get game by ID
 * GET /api/games/:id
 */
export const getGameById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const game = await Game.findByPk(id);

    if (!game) {
      res.status(404).json({
        success: false,
        message: 'Game not found.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { game }
    });
  } catch (error) {
    console.error('Get game by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching game.'
    });
  }
};

/**
 * Create new game (admin only)
 * POST /api/games
 */
export const createGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      slug,
      description,
      synopsis,
      release_year,
      release_date,
      cover_url,
      banner_url,
      trailer_url,
      developer_id,
      publisher_id,
      release_status,
      availability_status,
      age_rating,
      rawg_id,
      metacritic_score
    } = req.body;

    // Check if slug already exists
    const existingGame = await Game.findOne({ where: { slug } });
    if (existingGame) {
      res.status(400).json({
        success: false,
        message: 'A game with this slug already exists.'
      });
      return;
    }

    const game = await Game.create({
      title,
      slug,
      description,
      synopsis,
      release_year,
      release_date,
      cover_url,
      banner_url,
      trailer_url,
      developer_id,
      publisher_id,
      release_status: release_status || 'released',
      availability_status: availability_status || 'available',
      age_rating,
      rawg_id,
      metacritic_score
    });

    res.status(201).json({
      success: true,
      message: 'Game created successfully.',
      data: { game }
    });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating game.'
    });
  }
};

/**
 * Update game (admin only)
 * PUT /api/games/:id
 */
export const updateGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const game = await Game.findByPk(id);
    if (!game) {
      res.status(404).json({
        success: false,
        message: 'Game not found.'
      });
      return;
    }

    // Update fields
    const updateFields = [
      'title', 'description', 'synopsis', 'release_year', 'release_date',
      'cover_url', 'banner_url', 'trailer_url', 'developer_id', 'publisher_id',
      'release_status', 'availability_status', 'discontinuation_date',
      'official_abandonment_date', 'rerelease_date', 'abandonment_reason',
      'development_percentage', 'age_rating', 'is_early_access', 'was_rereleased',
      'rawg_id', 'metacritic_score'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        (game as unknown as Record<string, unknown>)[field] = req.body[field];
      }
    });

    await game.save();

    res.status(200).json({
      success: true,
      message: 'Game updated successfully.',
      data: { game }
    });
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating game.'
    });
  }
};

/**
 * Delete game (admin only)
 * DELETE /api/games/:id
 */
export const deleteGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const game = await Game.findByPk(id);
    if (!game) {
      res.status(404).json({
        success: false,
        message: 'Game not found.'
      });
      return;
    }

    await game.destroy();

    res.status(200).json({
      success: true,
      message: 'Game deleted successfully.'
    });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting game.'
    });
  }
};

/**
 * Search games
 * GET /api/games/search
 */
export const searchGames = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
      res.status(400).json({
        success: false,
        message: 'Search query is required.'
      });
      return;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows: games } = await Game.findAndCountAll({
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${q}%` } },
          { description: { [Op.iLike]: `%${q}%` } }
        ]
      },
      limit: limitNum,
      offset,
      order: [['title', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: {
        games,
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(count / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Search games error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching games.'
    });
  }
};

/**
 * Get upcoming releases
 * GET /api/games/upcoming-releases
 */
export const getUpcomingReleases = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows: games } = await Game.findAndCountAll({
      where: {
        release_status: {
          [Op.in]: ['coming_soon', 'in_development']
        }
      },
      limit: limitNum,
      offset,
      order: [['release_date', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: {
        games,
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(count / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get upcoming releases error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming releases.'
    });
  }
};

/**
 * Get abandonware games
 * GET /api/games/abandonware
 */
export const getAbandonwareGames = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows: games } = await Game.findAndCountAll({
      where: {
        availability_status: 'abandonware'
      },
      limit: limitNum,
      offset,
      order: [['title', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: {
        games,
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(count / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get abandonware games error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching abandonware games.'
    });
  }
};
