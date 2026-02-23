import { Request, Response } from 'express';
import { Op } from 'sequelize';
import {
  Platform, Game, GamePlatform, Developer, Publisher, Genre,
} from '../models';
import {
  getPaginationParams,
  getPaginationResult,
  parseId,
  sanitizeSearchQuery,
  updateObjectFields,
} from '../utils/helpers';
import { catalogCache } from '../utils/cache';

// ──────────────────────────────────────────────
// GET /api/platforms  – List all platforms
// ──────────────────────────────────────────────

export const getAllPlatforms = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationParams(req);

    const where: Record<string, unknown> = {};

    // Filters
    const { type, manufacturer, generation, search } = req.query;
    if (type) where.type = type;
    if (manufacturer) where.manufacturer = { [Op.iLike]: `%${sanitizeSearchQuery(manufacturer as string)}%` };
    if (generation) where.generation = parseInt(generation as string);

    if (search) {
      const q = sanitizeSearchQuery(search as string);
      if (q) {
        where[Op.or as any] = [
          { name: { [Op.iLike]: `%${q}%` } },
          { manufacturer: { [Op.iLike]: `%${q}%` } },
          { slug: { [Op.iLike]: `%${q}%` } },
        ];
      }
    }

    // Support ?all=true to return every platform without pagination (for dropdowns)
    if (req.query.all === 'true') {
      const platforms = await Platform.findAll({
        where,
        attributes: ['id', 'name', 'slug', 'type', 'manufacturer', 'generation', 'release_year', 'logo_url', 'primary_color'],
        order: [['name', 'ASC']],
      });
      res.status(200).json({ success: true, data: { platforms } });
      return;
    }

    const { count, rows: platforms } = await Platform.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      data: {
        platforms,
        pagination: getPaginationResult(count, page, limit),
      },
    });
  } catch (error) {
    console.error('Get all platforms error:', error);
    res.status(500).json({ success: false, message: 'Error fetching platforms.' });
  }
};

// ──────────────────────────────────────────────
// GET /api/platforms/:id  – Platform detail
// ──────────────────────────────────────────────

export const getPlatformById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid platform ID.' });
      return;
    }

    const platform = await Platform.findByPk(id);
    if (!platform) {
      res.status(404).json({ success: false, message: 'Platform not found.' });
      return;
    }

    // Include game count
    const gameCount = await GamePlatform.count({ where: { platform_id: id } });

    res.status(200).json({
      success: true,
      data: {
        platform: { ...(platform.toJSON()), game_count: gameCount },
      },
    });
  } catch (error) {
    console.error('Get platform by ID error:', error);
    res.status(500).json({ success: false, message: 'Error fetching platform.' });
  }
};

// ──────────────────────────────────────────────
// POST /api/platforms  – Create platform (admin)
// ──────────────────────────────────────────────

export const createPlatform = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, manufacturer, type, generation, release_year, discontinuation_year, logo_url, primary_color } = req.body;

    const existing = await Platform.findOne({ where: { slug } });
    if (existing) {
      res.status(400).json({ success: false, message: 'A platform with this slug already exists.' });
      return;
    }

    const platform = await Platform.create({
      name, slug, manufacturer, type, generation,
      release_year, discontinuation_year, logo_url, primary_color,
    });

    res.status(201).json({ success: true, message: 'Platform created successfully.', data: { platform } });
  } catch (error) {
    console.error('Create platform error:', error);
    res.status(500).json({ success: false, message: 'Error creating platform.' });
  }
};

// ──────────────────────────────────────────────
// PUT /api/platforms/:id  – Update platform (admin)
// ──────────────────────────────────────────────

export const updatePlatform = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid platform ID.' });
      return;
    }

    const platform = await Platform.findByPk(id);
    if (!platform) {
      res.status(404).json({ success: false, message: 'Platform not found.' });
      return;
    }

    const allowedFields = [
      'name', 'manufacturer', 'type', 'generation',
      'release_year', 'discontinuation_year', 'logo_url', 'primary_color',
    ];
    updateObjectFields(platform, req.body, allowedFields);
    await platform.save();

    // Invalidate cached catalog and game details that include this platform
    catalogCache.invalidatePrefix('catalog:');

    res.status(200).json({ success: true, message: 'Platform updated successfully.', data: { platform } });
  } catch (error) {
    console.error('Update platform error:', error);
    res.status(500).json({ success: false, message: 'Error updating platform.' });
  }
};

// ──────────────────────────────────────────────
// DELETE /api/platforms/:id  – Delete platform (admin)
// ──────────────────────────────────────────────

export const deletePlatform = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid platform ID.' });
      return;
    }

    const platform = await Platform.findByPk(id);
    if (!platform) {
      res.status(404).json({ success: false, message: 'Platform not found.' });
      return;
    }

    // Check if platform has associated games
    const assocCount = await GamePlatform.count({ where: { platform_id: id } });
    if (assocCount > 0) {
      res.status(409).json({
        success: false,
        message: `Cannot delete platform with ${assocCount} associated game(s). Remove associations first.`,
      });
      return;
    }

    await platform.destroy();
    catalogCache.invalidatePrefix('catalog:');

    res.status(200).json({ success: true, message: 'Platform deleted successfully.' });
  } catch (error) {
    console.error('Delete platform error:', error);
    res.status(500).json({ success: false, message: 'Error deleting platform.' });
  }
};

// ──────────────────────────────────────────────
// GET /api/platforms/:id/games  – Games for a platform
// ──────────────────────────────────────────────

export const getPlatformGames = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: 'Invalid platform ID.' });
      return;
    }

    const platform = await Platform.findByPk(id, { attributes: ['id', 'name', 'slug'] });
    if (!platform) {
      res.status(404).json({ success: false, message: 'Platform not found.' });
      return;
    }

    const { page, limit, offset } = getPaginationParams(req);

    const { count, rows: games } = await Game.findAndCountAll({
      include: [
        {
          model: Platform,
          as: 'platforms',
          where: { id },
          attributes: [],
          through: { attributes: ['platform_release_date', 'exclusivity'] },
        },
        { model: Developer, as: 'developer', attributes: ['id', 'name', 'slug'] },
        { model: Publisher, as: 'publisher', attributes: ['id', 'name', 'slug'] },
      ],
      attributes: [
        'id', 'title', 'slug', 'cover_url', 'release_year', 'release_date',
        'release_status', 'availability_status', 'metacritic_score', 'average_rating', 'total_reviews',
      ],
      limit,
      offset,
      order: [['release_date', 'DESC NULLS LAST']],
      distinct: true,
      subQuery: false,
    });

    // Fetch platform-specific release info for these games
    const gameIds = games.map(g => g.id);
    let platformInfoMap: Record<number, { platform_release_date: string | null; exclusivity: string }> = {};
    if (gameIds.length > 0) {
      const gpRows = await GamePlatform.findAll({
        where: { game_id: { [Op.in]: gameIds }, platform_id: id },
        raw: true,
      });
      platformInfoMap = Object.fromEntries(
        gpRows.map((r: any) => [r.game_id, {
          platform_release_date: r.platform_release_date || null,
          exclusivity: r.exclusivity || 'none',
        }])
      );
    }

    const gamesData = games.map(g => {
      const j = g.toJSON() as any;
      const pInfo = platformInfoMap[j.id] || { platform_release_date: null, exclusivity: 'none' };
      return {
        ...j,
        platforms: undefined,
        platform_release_date: pInfo.platform_release_date,
        exclusivity: pInfo.exclusivity,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        platform: platform.toJSON(),
        games: gamesData,
        pagination: getPaginationResult(count, page, limit),
      },
    });
  } catch (error) {
    console.error('Get platform games error:', error);
    res.status(500).json({ success: false, message: 'Error fetching platform games.' });
  }
};

// ──────────────────────────────────────────────
// GET /api/games/:id/platforms  – Platforms for a game
// ──────────────────────────────────────────────

export const getGamePlatforms = async (req: Request, res: Response): Promise<void> => {
  try {
    const gameId = parseId(req.params.id);
    if (!gameId) {
      res.status(400).json({ success: false, message: 'Invalid game ID.' });
      return;
    }

    const game = await Game.findByPk(gameId, { attributes: ['id', 'title', 'slug'] });
    if (!game) {
      res.status(404).json({ success: false, message: 'Game not found.' });
      return;
    }

    const gpRows = await GamePlatform.findAll({
      where: { game_id: gameId },
      include: [
        {
          model: Platform,
          as: 'platform',
          attributes: ['id', 'name', 'slug', 'type', 'manufacturer', 'generation', 'release_year', 'logo_url', 'primary_color'],
        },
      ],
      order: [[{ model: Platform, as: 'platform' }, 'name', 'ASC']],
    });

    const platforms = gpRows.map((row: any) => {
      const p = row.platform?.toJSON ? row.platform.toJSON() : row.platform;
      return {
        ...p,
        platform_release_date: row.platform_release_date || null,
        exclusivity: row.exclusivity || 'none',
      };
    });

    res.status(200).json({
      success: true,
      data: { game: game.toJSON(), platforms },
    });
  } catch (error) {
    console.error('Get game platforms error:', error);
    res.status(500).json({ success: false, message: 'Error fetching game platforms.' });
  }
};

// ──────────────────────────────────────────────
// POST /api/games/:id/platforms  – Associate platforms with a game (admin)
// Body: { platforms: [{ platform_id, platform_release_date?, exclusivity? }] }
// ──────────────────────────────────────────────

export const setGamePlatforms = async (req: Request, res: Response): Promise<void> => {
  try {
    const gameId = parseId(req.params.id);
    if (!gameId) {
      res.status(400).json({ success: false, message: 'Invalid game ID.' });
      return;
    }

    const game = await Game.findByPk(gameId, { attributes: ['id'] });
    if (!game) {
      res.status(404).json({ success: false, message: 'Game not found.' });
      return;
    }

    const { platforms } = req.body;
    if (!Array.isArray(platforms)) {
      res.status(400).json({ success: false, message: 'platforms must be an array.' });
      return;
    }

    // Validate all platform IDs exist
    const platformIds = platforms.map((p: any) => parseInt(p.platform_id));
    const validPlatforms = await Platform.findAll({
      where: { id: { [Op.in]: platformIds } },
      attributes: ['id'],
    });
    const validIds = new Set(validPlatforms.map(p => p.id));
    const invalidIds = platformIds.filter(id => !validIds.has(id));
    if (invalidIds.length > 0) {
      res.status(400).json({
        success: false,
        message: `Platform IDs not found: ${invalidIds.join(', ')}`,
      });
      return;
    }

    // Remove existing associations and recreate (full replace)
    await GamePlatform.destroy({ where: { game_id: gameId } });

    const records = platforms.map((p: any) => ({
      game_id: gameId,
      platform_id: parseInt(p.platform_id),
      platform_release_date: p.platform_release_date || null,
      exclusivity: p.exclusivity || 'none',
    }));

    await GamePlatform.bulkCreate(records);

    // Invalidate relevant caches
    catalogCache.invalidatePrefix('catalog:');
    catalogCache.del(`game:${gameId}`);

    // Return the new associations
    const updated = await GamePlatform.findAll({
      where: { game_id: gameId },
      include: [{
        model: Platform, as: 'platform',
        attributes: ['id', 'name', 'slug', 'type'],
      }],
    });

    const result = updated.map((row: any) => ({
      platform_id: row.platform_id,
      platform: row.platform?.toJSON ? row.platform.toJSON() : row.platform,
      platform_release_date: row.platform_release_date || null,
      exclusivity: row.exclusivity || 'none',
    }));

    res.status(200).json({
      success: true,
      message: `${result.length} platform(s) associated with the game.`,
      data: { platforms: result },
    });
  } catch (error) {
    console.error('Set game platforms error:', error);
    res.status(500).json({ success: false, message: 'Error managing game platforms.' });
  }
};

// ──────────────────────────────────────────────
// DELETE /api/games/:id/platforms/:platformId  – Remove single association (admin)
// ──────────────────────────────────────────────

export const removeGamePlatform = async (req: Request, res: Response): Promise<void> => {
  try {
    const gameId = parseId(req.params.id);
    const platformId = parseId(req.params.platformId);
    if (!gameId || !platformId) {
      res.status(400).json({ success: false, message: 'Invalid game or platform ID.' });
      return;
    }

    const deleted = await GamePlatform.destroy({
      where: { game_id: gameId, platform_id: platformId },
    });

    if (deleted === 0) {
      res.status(404).json({ success: false, message: 'Association not found.' });
      return;
    }

    catalogCache.invalidatePrefix('catalog:');
    catalogCache.del(`game:${gameId}`);

    res.status(200).json({ success: true, message: 'Platform association removed.' });
  } catch (error) {
    console.error('Remove game platform error:', error);
    res.status(500).json({ success: false, message: 'Error removing game platform.' });
  }
};
