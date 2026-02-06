import { Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import { AuthenticatedRequest } from '../middlewares/auth';
import UserCollection from '../models/UserCollection';
import Game from '../models/Game';
import sequelize from '../config/database';

/**
 * Get user's collection with game details
 * GET /api/collection
 */
export const getCollection = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const { status, page = '1', limit = '50' } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const offset = (pageNum - 1) * limitNum;

        let statusFilter = '';
        if (status && status !== 'all') {
            statusFilter = `AND uc.status = :status`;
        }

        const countResult = await sequelize.query<{ count: string }>(
            `SELECT COUNT(*) as count FROM user_collection uc WHERE uc.user_id = :userId ${statusFilter}`,
            { replacements: { userId, status }, type: QueryTypes.SELECT }
        );
        const total = parseInt(countResult[0]?.count || '0', 10);

        const items = await sequelize.query(
            `SELECT uc.id, uc.user_id, uc.game_id, uc.status, uc.format, uc.hours_played, 
              uc.personal_notes, uc.rating, uc.created_at, uc.updated_at,
              g.title, g.slug, g.cover_url, g.release_year, g.release_date, 
              g.metacritic_score, g.release_status, g.availability_status,
              g.description, g.tags, g.genres, g.platforms as game_platforms,
              g.developer_name, g.publisher_name
       FROM user_collection uc
       JOIN games g ON uc.game_id = g.id
       WHERE uc.user_id = :userId ${statusFilter}
       ORDER BY uc.updated_at DESC
       LIMIT :limit OFFSET :offset`,
            { replacements: { userId, status, limit: limitNum, offset }, type: QueryTypes.SELECT }
        );

        res.status(200).json({
            success: true,
            data: {
                items,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        console.error('Get collection error:', error);
        res.status(500).json({ success: false, message: 'Error fetching collection.' });
    }
};

/**
 * Add game to collection or update status
 * POST /api/collection
 */
export const addToCollection = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const { game_id, status = 'not_started', format = 'digital', platform_id } = req.body;

        if (!game_id) {
            res.status(400).json({ success: false, message: 'game_id is required' });
            return;
        }

        // Check if game exists
        const game = await Game.findByPk(game_id);
        if (!game) {
            res.status(404).json({ success: false, message: 'Game not found' });
            return;
        }

        // Upsert - update if exists, create if not
        const existing = await UserCollection.findOne({
            where: { user_id: userId, game_id }
        });

        if (existing) {
            existing.status = status;
            if (format) existing.format = format;
            if (platform_id) existing.platform_id = platform_id;
            await existing.save();

            res.status(200).json({
                success: true,
                message: 'Collection item updated.',
                data: { item: existing }
            });
        } else {
            const item = await UserCollection.create({
                user_id: userId,
                game_id,
                status,
                format,
                platform_id,
                hours_played: 0
            });

            res.status(201).json({
                success: true,
                message: 'Game added to collection.',
                data: { item }
            });
        }
    } catch (error) {
        console.error('Add to collection error:', error);
        res.status(500).json({ success: false, message: 'Error adding to collection.' });
    }
};

/**
 * Update collection item
 * PUT /api/collection/:gameId
 */
export const updateCollectionItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const gameId = parseInt(req.params.gameId);
        const { status, format, hours_played, personal_notes, rating } = req.body;

        const item = await UserCollection.findOne({
            where: { user_id: userId, game_id: gameId }
        });

        if (!item) {
            res.status(404).json({ success: false, message: 'Game not in collection' });
            return;
        }

        if (status) item.status = status;
        if (format) item.format = format;
        if (hours_played !== undefined) item.hours_played = hours_played;
        if (personal_notes !== undefined) item.personal_notes = personal_notes;
        if (rating !== undefined) item.rating = rating;

        await item.save();

        res.status(200).json({
            success: true,
            message: 'Collection item updated.',
            data: { item }
        });
    } catch (error) {
        console.error('Update collection item error:', error);
        res.status(500).json({ success: false, message: 'Error updating collection item.' });
    }
};

/**
 * Remove game from collection
 * DELETE /api/collection/:gameId
 */
export const removeFromCollection = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const gameId = parseInt(req.params.gameId);

        const item = await UserCollection.findOne({
            where: { user_id: userId, game_id: gameId }
        });

        if (!item) {
            res.status(404).json({ success: false, message: 'Game not in collection' });
            return;
        }

        await item.destroy();

        res.status(200).json({
            success: true,
            message: 'Game removed from collection.'
        });
    } catch (error) {
        console.error('Remove from collection error:', error);
        res.status(500).json({ success: false, message: 'Error removing from collection.' });
    }
};

/**
 * Get collection status for a specific game
 * GET /api/collection/status/:gameId
 */
export const getGameCollectionStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(200).json({ success: true, data: { status: null } });
            return;
        }

        const gameId = parseInt(req.params.gameId);

        const item = await UserCollection.findOne({
            where: { user_id: userId, game_id: gameId }
        });

        res.status(200).json({
            success: true,
            data: { item: item || null }
        });
    } catch (error) {
        console.error('Get game collection status error:', error);
        res.status(500).json({ success: false, message: 'Error fetching game status.' });
    }
};

/**
 * Get user collection stats
 * GET /api/collection/stats
 */
export const getCollectionStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const stats = await sequelize.query<{ status: string; count: string }>(
            `SELECT status, COUNT(*) as count FROM user_collection WHERE user_id = :userId GROUP BY status`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        const totalResult = await sequelize.query<{ count: string }>(
            `SELECT COUNT(*) as count FROM user_collection WHERE user_id = :userId`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        const statsMap: Record<string, number> = {};
        for (const row of stats) {
            statsMap[row.status] = parseInt(row.count, 10);
        }

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    total: parseInt(totalResult[0]?.count || '0', 10),
                    playing: statsMap['playing'] || 0,
                    completed: statsMap['completed'] || 0,
                    paused: statsMap['paused'] || 0,
                    abandoned: statsMap['abandoned'] || 0,
                    not_started: statsMap['not_started'] || 0,
                    wishlist: statsMap['wishlist'] || 0,
                    backlog: statsMap['backlog'] || 0
                }
            }
        });
    } catch (error) {
        console.error('Get collection stats error:', error);
        res.status(500).json({ success: false, message: 'Error fetching collection stats.' });
    }
};
