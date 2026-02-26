import { Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import { AuthenticatedRequest } from '../middlewares/auth';
import UserCollection from '../models/UserCollection';
import Game from '../models/Game';
import Platform from '../models/Platform';
import sequelize from '../config/database';
import {
    getPaginationParams,
    getPaginationResult,
    parseId,
    successResponse,
    errorResponse,
} from '../utils/helpers';
import { toPdf, COLLECTION_HEADERS } from '../services/exportService';

// ─── CRUD ────────────────────────────────────────────────────────────

/**
 * Get user's collection with game details
 * GET /api/collection
 * Supports: ?status=, ?format=, ?platform_id=, ?sort=, ?order=, ?page=, ?limit=
 */
export const getCollection = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json(errorResponse('Not authenticated'));
            return;
        }

        const { page, limit, offset } = getPaginationParams(req, 20);

        const where: any = { user_id: userId };
        if (req.query.status && req.query.status !== 'all') {
            where.status = req.query.status;
        }
        if (req.query.format) {
            where.format = req.query.format;
        }
        if (req.query.platform_id) {
            where.platform_id = parseInt(req.query.platform_id as string);
        }

        const sortBy = (req.query.sort as string) || 'updated_at';
        const order = ((req.query.order as string) || 'DESC').toUpperCase();
        const validSorts: Record<string, string> = {
            updated_at: 'updated_at',
            created_at: 'created_at',
            hours_played: 'hours_played',
            price_paid: 'price_paid',
            title: 'title',
        };
        const sortColumn = validSorts[sortBy] || 'updated_at';
        const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

        // For title sort we need to sort by the included Game model
        const orderClause: any[] = sortColumn === 'title'
            ? [[{ model: Game, as: 'game' }, 'title', sortOrder]]
            : [[sortColumn, sortOrder]];

        const { count, rows } = await UserCollection.findAndCountAll({
            where,
            include: [
                {
                    model: Game,
                    as: 'game',
                    attributes: ['id', 'title', 'slug', 'cover_url', 'release_year', 'release_date',
                        'metacritic_score', 'release_status', 'availability_status', 'average_rating'],
                },
                {
                    model: Platform,
                    as: 'platform',
                    attributes: ['id', 'name', 'slug'],
                },
            ],
            order: orderClause,
            limit,
            offset,
        });

        res.status(200).json(successResponse({
            items: rows,
            pagination: getPaginationResult(count, page, limit),
        }));
    } catch (error) {
        console.error('Get collection error:', error);
        res.status(500).json(errorResponse('Error fetching collection'));
    }
};

/**
 * Add game to collection (supports multiple copies via different platform_id)
 * POST /api/collection
 */
export const addToCollection = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json(errorResponse('Not authenticated'));
            return;
        }

        const {
            game_id, platform_id, status = 'not_started', format = 'digital',
            acquisition_date, price_paid, hours_played, personal_notes, rating,
        } = req.body;

        if (!game_id) {
            res.status(400).json(errorResponse('game_id is required'));
            return;
        }
        if (!platform_id) {
            res.status(400).json(errorResponse('platform_id is required'));
            return;
        }

        const game = await Game.findByPk(game_id);
        if (!game) {
            res.status(404).json(errorResponse('Game not found'));
            return;
        }

        const platform = await Platform.findByPk(platform_id);
        if (!platform) {
            res.status(404).json(errorResponse('Platform not found'));
            return;
        }

        // Check for duplicate (same user + game + platform)
        const existing = await UserCollection.findOne({
            where: { user_id: userId, game_id, platform_id },
        });

        if (existing) {
            res.status(409).json(errorResponse('This game is already in your collection for this platform. Use PUT to update.'));
            return;
        }

        const item = await UserCollection.create({
            user_id: userId,
            game_id,
            platform_id,
            status,
            format,
            acquisition_date: acquisition_date || undefined,
            price_paid: price_paid !== undefined ? price_paid : undefined,
            hours_played: hours_played || 0,
            personal_notes: personal_notes || undefined,
            rating: rating !== undefined ? rating : undefined,
        } as any);

        const created = await UserCollection.findByPk(item.id, {
            include: [
                { model: Game, as: 'game', attributes: ['id', 'title', 'slug', 'cover_url'] },
                { model: Platform, as: 'platform', attributes: ['id', 'name'] },
            ],
        });

        res.status(201).json(successResponse(created, 'Game added to collection'));
    } catch (error: any) {
        console.error('Add to collection error:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            res.status(409).json(errorResponse('This game is already in your collection for this platform'));
            return;
        }
        res.status(500).json(errorResponse('Error adding to collection'));
    }
};

/**
 * Update collection item by ID
 * PUT /api/collection/:id
 */
export const updateCollectionItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json(errorResponse('Not authenticated'));
            return;
        }

        const itemId = parseId(req.params.id);
        if (!itemId) {
            res.status(400).json(errorResponse('Invalid collection item ID'));
            return;
        }

        const item = await UserCollection.findOne({
            where: { id: itemId, user_id: userId },
        });

        if (!item) {
            res.status(404).json(errorResponse('Collection item not found'));
            return;
        }

        const { status, format, hours_played, personal_notes, rating, acquisition_date, price_paid } = req.body;

        if (status !== undefined) item.status = status;
        if (format !== undefined) item.format = format;
        if (hours_played !== undefined) item.hours_played = hours_played;
        if (personal_notes !== undefined) item.personal_notes = personal_notes;
        if (rating !== undefined) item.rating = rating;
        if (acquisition_date !== undefined) item.acquisition_date = acquisition_date;
        if (price_paid !== undefined) item.price_paid = price_paid;

        await item.save();

        const updated = await UserCollection.findByPk(item.id, {
            include: [
                { model: Game, as: 'game', attributes: ['id', 'title', 'slug', 'cover_url'] },
                { model: Platform, as: 'platform', attributes: ['id', 'name'] },
            ],
        });

        res.status(200).json(successResponse(updated, 'Collection item updated'));
    } catch (error) {
        console.error('Update collection item error:', error);
        res.status(500).json(errorResponse('Error updating collection item'));
    }
};

/**
 * Remove collection item by ID
 * DELETE /api/collection/:id
 */
export const removeFromCollection = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json(errorResponse('Not authenticated'));
            return;
        }

        const itemId = parseId(req.params.id);
        if (!itemId) {
            res.status(400).json(errorResponse('Invalid collection item ID'));
            return;
        }

        const item = await UserCollection.findOne({
            where: { id: itemId, user_id: userId },
        });

        if (!item) {
            res.status(404).json(errorResponse('Collection item not found'));
            return;
        }

        await item.destroy();

        res.status(200).json(successResponse(null, 'Game removed from collection'));
    } catch (error) {
        console.error('Remove from collection error:', error);
        res.status(500).json(errorResponse('Error removing from collection'));
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
            res.status(200).json(successResponse({ items: [] }));
            return;
        }

        const gameId = parseId(req.params.gameId);
        if (!gameId) {
            res.status(400).json(errorResponse('Invalid game ID'));
            return;
        }

        // Return all copies of this game in the user's collection
        const items = await UserCollection.findAll({
            where: { user_id: userId, game_id: gameId },
            include: [
                { model: Platform, as: 'platform', attributes: ['id', 'name'] },
            ],
        });

        res.status(200).json(successResponse({ items }));
    } catch (error) {
        console.error('Get game collection status error:', error);
        res.status(500).json(errorResponse('Error fetching game status'));
    }
};

/**
 * Get basic collection stats (status distribution)
 * GET /api/collection/stats
 */
export const getCollectionStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json(errorResponse('Not authenticated'));
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

        res.status(200).json(successResponse({
            stats: {
                total: parseInt(totalResult[0]?.count || '0', 10),
                playing: statsMap['playing'] || 0,
                completed: statsMap['completed'] || 0,
                paused: statsMap['paused'] || 0,
                abandoned: statsMap['abandoned'] || 0,
                not_started: statsMap['not_started'] || 0,
                wishlist: statsMap['wishlist'] || 0,
                backlog: statsMap['backlog'] || 0,
            },
        }));
    } catch (error) {
        console.error('Get collection stats error:', error);
        res.status(500).json(errorResponse('Error fetching collection stats'));
    }
};

// ─── Statistics ──────────────────────────────────────────────────────

/**
 * Comprehensive collection statistics
 * GET /api/collection/statistics
 */
export const getCollectionStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json(errorResponse('Not authenticated'));
            return;
        }

        // 1. Total games & unique games
        const totals = await sequelize.query<{ total: string; unique_games: string }>(
            `SELECT COUNT(*) as total, COUNT(DISTINCT game_id) as unique_games
             FROM user_collection WHERE user_id = :userId`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );
        const total = parseInt(totals[0]?.total || '0', 10);
        const uniqueGames = parseInt(totals[0]?.unique_games || '0', 10);

        // 2. Status distribution
        const statusDist = await sequelize.query<{ status: string; count: string }>(
            `SELECT status, COUNT(*) as count FROM user_collection WHERE user_id = :userId GROUP BY status ORDER BY count DESC`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );
        const statusDistribution: Record<string, number> = {};
        statusDist.forEach(r => { statusDistribution[r.status] = parseInt(r.count, 10); });

        // 3. Platform distribution
        const platformDist = await sequelize.query<{ platform_id: number; name: string; count: string }>(
            `SELECT uc.platform_id, p.name, COUNT(*) as count
             FROM user_collection uc
             JOIN platforms p ON uc.platform_id = p.id
             WHERE uc.user_id = :userId
             GROUP BY uc.platform_id, p.name
             ORDER BY count DESC`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        // 4. Genre distribution (through games_genres junction)
        const genreDist = await sequelize.query<{ genre_id: number; name: string; count: string }>(
            `SELECT ge.id as genre_id, ge.name, COUNT(DISTINCT uc.game_id) as count
             FROM user_collection uc
             JOIN games_genres gg ON uc.game_id = gg.game_id
             JOIN genres ge ON gg.genre_id = ge.id
             WHERE uc.user_id = :userId
             GROUP BY ge.id, ge.name
             ORDER BY count DESC`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        // 5. Format distribution
        const formatDist = await sequelize.query<{ format: string; count: string }>(
            `SELECT format, COUNT(*) as count FROM user_collection WHERE user_id = :userId GROUP BY format`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );
        const formatDistribution: Record<string, number> = {};
        formatDist.forEach(r => { formatDistribution[r.format] = parseInt(r.count, 10); });

        // 6. Estimated collection value
        const valueResult = await sequelize.query<{ total_value: string; avg_value: string }>(
            `SELECT COALESCE(SUM(price_paid), 0) as total_value, COALESCE(AVG(price_paid), 0) as avg_value
             FROM user_collection WHERE user_id = :userId AND price_paid IS NOT NULL`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        // 7. Completion rate
        const completed = statusDistribution['completed'] || 0;
        const playable = total - (statusDistribution['wishlist'] || 0);
        const completionRate = playable > 0 ? parseFloat(((completed / playable) * 100).toFixed(1)) : 0;

        // 8. Hours played aggregation
        const hoursResult = await sequelize.query<{ total_hours: string; avg_hours: string; max_hours: string }>(
            `SELECT COALESCE(SUM(hours_played), 0) as total_hours,
                    COALESCE(AVG(hours_played), 0) as avg_hours,
                    COALESCE(MAX(hours_played), 0) as max_hours
             FROM user_collection WHERE user_id = :userId AND hours_played > 0`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        // 9. Recent additions (last 30 days)
        const recentResult = await sequelize.query<{ count: string }>(
            `SELECT COUNT(*) as count FROM user_collection
             WHERE user_id = :userId AND created_at >= NOW() - INTERVAL '30 days'`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        // 10. Average rating given
        const ratingResult = await sequelize.query<{ avg_rating: string; rated_count: string }>(
            `SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(rating) as rated_count
             FROM user_collection WHERE user_id = :userId AND rating IS NOT NULL`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        res.status(200).json(successResponse({
            total_items: total,
            unique_games: uniqueGames,
            status_distribution: statusDistribution,
            platform_distribution: platformDist.map(r => ({
                platform_id: r.platform_id,
                name: r.name,
                count: parseInt(r.count, 10),
            })),
            genre_distribution: genreDist.map(r => ({
                genre_id: r.genre_id,
                name: r.name,
                count: parseInt(r.count, 10),
            })),
            format_distribution: formatDistribution,
            estimated_value: {
                total: parseFloat(parseFloat(valueResult[0]?.total_value || '0').toFixed(2)),
                average: parseFloat(parseFloat(valueResult[0]?.avg_value || '0').toFixed(2)),
            },
            completion_rate: completionRate,
            hours_played: {
                total: parseInt(hoursResult[0]?.total_hours || '0', 10),
                average: parseFloat(parseFloat(hoursResult[0]?.avg_hours || '0').toFixed(1)),
                max: parseInt(hoursResult[0]?.max_hours || '0', 10),
            },
            recent_additions_30d: parseInt(recentResult[0]?.count || '0', 10),
            ratings: {
                average_given: parseFloat(parseFloat(ratingResult[0]?.avg_rating || '0').toFixed(2)),
                rated_count: parseInt(ratingResult[0]?.rated_count || '0', 10),
            },
        }));
    } catch (error) {
        console.error('Get collection statistics error:', error);
        res.status(500).json(errorResponse('Error fetching collection statistics'));
    }
};

// ─── Export ──────────────────────────────────────────────────────────

/**
 * Export collection as CSV or JSON
 * GET /api/collection/export?format=csv|json
 */
export const exportCollection = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json(errorResponse('Not authenticated'));
            return;
        }

        const exportFormat = (req.query.format as string || 'csv').toLowerCase();
        if (!['csv', 'json', 'pdf'].includes(exportFormat)) {
            res.status(400).json(errorResponse('Supported formats: csv, json, pdf'));
            return;
        }

        const items = await sequelize.query<{
            id: number; game_title: string; platform_name: string; status: string;
            format: string; acquisition_date: string; price_paid: string;
            hours_played: number; rating: number; personal_notes: string;
            created_at: string; updated_at: string;
        }>(
            `SELECT uc.id, g.title as game_title, p.name as platform_name,
                    uc.status, uc.format, uc.acquisition_date, uc.price_paid,
                    uc.hours_played, uc.rating, uc.personal_notes,
                    uc.created_at, uc.updated_at
             FROM user_collection uc
             JOIN games g ON uc.game_id = g.id
             JOIN platforms p ON uc.platform_id = p.id
             WHERE uc.user_id = :userId
             ORDER BY g.title ASC`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        if (exportFormat === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="gamevault_collection.json"');
            res.status(200).json({
                exported_at: new Date().toISOString(),
                total_items: items.length,
                collection: items,
            });
            return;
        }

        if (exportFormat === 'pdf') {
            const pdfBuffer = await toPdf({
                title: 'My Game Collection',
                subtitle: `${items.length} items — exported by user #${userId}`,
                headers: COLLECTION_HEADERS,
                rows: items as unknown as Record<string, any>[],
            });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="gamevault_collection.pdf"');
            res.status(200).send(pdfBuffer);
            return;
        }

        // CSV export
        const csvHeaders = [
            'ID', 'Game', 'Platform', 'Status', 'Format', 'Acquisition Date',
            'Price Paid', 'Hours Played', 'Rating', 'Notes', 'Added At', 'Updated At',
        ];

        const escapeCsv = (val: any): string => {
            if (val === null || val === undefined) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const csvRows = items.map(item => [
            item.id,
            escapeCsv(item.game_title),
            escapeCsv(item.platform_name),
            item.status,
            item.format,
            item.acquisition_date || '',
            item.price_paid || '',
            item.hours_played,
            item.rating || '',
            escapeCsv(item.personal_notes),
            item.created_at,
            item.updated_at,
        ].join(','));

        const csv = [csvHeaders.join(','), ...csvRows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="gamevault_collection.csv"');
        res.status(200).send(csv);
    } catch (error) {
        console.error('Export collection error:', error);
        res.status(500).json(errorResponse('Error exporting collection'));
    }
};
