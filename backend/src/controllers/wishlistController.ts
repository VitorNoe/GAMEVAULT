import { Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import { AuthenticatedRequest } from '../middlewares/auth';
import Wishlist from '../models/Wishlist';
import Game from '../models/Game';
import Platform from '../models/Platform';
import Notification from '../models/Notification';
import sequelize from '../config/database';
import {
    getPaginationParams,
    getPaginationResult,
    parseId,
    successResponse,
    errorResponse,
} from '../utils/helpers';

// ─── CRUD ────────────────────────────────────────────────────────────

/**
 * Get user's wishlist
 * GET /api/wishlist
 * Supports: ?priority=, ?sort=, ?order=, ?page=, ?limit=
 */
export const getWishlist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json(errorResponse('Not authenticated'));
            return;
        }

        const { page, limit, offset } = getPaginationParams(req, 20);

        const where: any = { user_id: userId };
        if (req.query.priority) {
            where.priority = req.query.priority;
        }

        const sortBy = (req.query.sort as string) || 'created_at';
        const order = ((req.query.order as string) || 'DESC').toUpperCase();
        const validSorts: Record<string, string> = {
            created_at: 'created_at',
            priority: 'priority',
            max_price: 'max_price',
            title: 'title',
        };
        const sortColumn = validSorts[sortBy] || 'created_at';
        const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

        const orderClause: any[] = sortColumn === 'title'
            ? [[{ model: Game, as: 'game' }, 'title', sortOrder]]
            : [[sortColumn, sortOrder]];

        const { count, rows } = await Wishlist.findAndCountAll({
            where,
            include: [
                {
                    model: Game,
                    as: 'game',
                    attributes: ['id', 'title', 'slug', 'cover_url', 'release_year', 'release_date',
                        'release_status', 'availability_status', 'average_rating', 'metacritic_score'],
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
        console.error('Get wishlist error:', error);
        res.status(500).json(errorResponse('Error fetching wishlist'));
    }
};

/**
 * Add a game to wishlist
 * POST /api/wishlist
 */
export const addToWishlist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json(errorResponse('Not authenticated'));
            return;
        }

        const { game_id, platform_id, priority = 'medium', max_price, notes } = req.body;

        if (!game_id) {
            res.status(400).json(errorResponse('game_id is required'));
            return;
        }

        const game = await Game.findByPk(game_id);
        if (!game) {
            res.status(404).json(errorResponse('Game not found'));
            return;
        }

        if (platform_id) {
            const platform = await Platform.findByPk(platform_id);
            if (!platform) {
                res.status(404).json(errorResponse('Platform not found'));
                return;
            }
        }

        // Check duplicate
        const existing = await Wishlist.findOne({
            where: { user_id: userId, game_id },
        });
        if (existing) {
            res.status(409).json(errorResponse('Game is already in your wishlist'));
            return;
        }

        const item = await Wishlist.create({
            user_id: userId,
            game_id,
            platform_id: platform_id || undefined,
            priority,
            max_price: max_price !== undefined ? max_price : undefined,
            notes: notes || undefined,
        } as any);

        const created = await Wishlist.findByPk(item.id, {
            include: [
                { model: Game, as: 'game', attributes: ['id', 'title', 'slug', 'cover_url', 'release_status'] },
                { model: Platform, as: 'platform', attributes: ['id', 'name'] },
            ],
        });

        res.status(201).json(successResponse(created, 'Game added to wishlist'));
    } catch (error: any) {
        console.error('Add to wishlist error:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            res.status(409).json(errorResponse('Game is already in your wishlist'));
            return;
        }
        res.status(500).json(errorResponse('Error adding to wishlist'));
    }
};

/**
 * Update wishlist item
 * PUT /api/wishlist/:id
 */
export const updateWishlistItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json(errorResponse('Not authenticated'));
            return;
        }

        const itemId = parseId(req.params.id);
        if (!itemId) {
            res.status(400).json(errorResponse('Invalid wishlist item ID'));
            return;
        }

        const item = await Wishlist.findOne({
            where: { id: itemId, user_id: userId },
        });

        if (!item) {
            res.status(404).json(errorResponse('Wishlist item not found'));
            return;
        }

        const { priority, max_price, notes, platform_id } = req.body;

        if (priority !== undefined) item.priority = priority;
        if (max_price !== undefined) item.max_price = max_price;
        if (notes !== undefined) item.notes = notes;
        if (platform_id !== undefined) {
            if (platform_id !== null) {
                const platform = await Platform.findByPk(platform_id);
                if (!platform) {
                    res.status(404).json(errorResponse('Platform not found'));
                    return;
                }
            }
            item.platform_id = platform_id;
        }

        await item.save();

        const updated = await Wishlist.findByPk(item.id, {
            include: [
                { model: Game, as: 'game', attributes: ['id', 'title', 'slug', 'cover_url', 'release_status'] },
                { model: Platform, as: 'platform', attributes: ['id', 'name'] },
            ],
        });

        res.status(200).json(successResponse(updated, 'Wishlist item updated'));
    } catch (error) {
        console.error('Update wishlist item error:', error);
        res.status(500).json(errorResponse('Error updating wishlist item'));
    }
};

/**
 * Remove game from wishlist
 * DELETE /api/wishlist/:id
 */
export const removeFromWishlist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json(errorResponse('Not authenticated'));
            return;
        }

        const itemId = parseId(req.params.id);
        if (!itemId) {
            res.status(400).json(errorResponse('Invalid wishlist item ID'));
            return;
        }

        const item = await Wishlist.findOne({
            where: { id: itemId, user_id: userId },
        });

        if (!item) {
            res.status(404).json(errorResponse('Wishlist item not found'));
            return;
        }

        await item.destroy();

        res.status(200).json(successResponse(null, 'Game removed from wishlist'));
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json(errorResponse('Error removing from wishlist'));
    }
};

/**
 * Get a single wishlist item by ID
 * GET /api/wishlist/:id
 */
export const getWishlistItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json(errorResponse('Not authenticated'));
            return;
        }

        const itemId = parseId(req.params.id);
        if (!itemId) {
            res.status(400).json(errorResponse('Invalid wishlist item ID'));
            return;
        }

        const item = await Wishlist.findOne({
            where: { id: itemId, user_id: userId },
            include: [
                {
                    model: Game,
                    as: 'game',
                    attributes: ['id', 'title', 'slug', 'cover_url', 'release_year', 'release_date',
                        'release_status', 'availability_status', 'average_rating', 'metacritic_score'],
                },
                {
                    model: Platform,
                    as: 'platform',
                    attributes: ['id', 'name', 'slug'],
                },
            ],
        });

        if (!item) {
            res.status(404).json(errorResponse('Wishlist item not found'));
            return;
        }

        res.status(200).json(successResponse(item));
    } catch (error) {
        console.error('Get wishlist item error:', error);
        res.status(500).json(errorResponse('Error fetching wishlist item'));
    }
};

/**
 * Check if a game is in the user's wishlist
 * GET /api/wishlist/check/:gameId
 */
export const checkWishlistStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(200).json(successResponse({ in_wishlist: false, item: null }));
            return;
        }

        const gameId = parseId(req.params.gameId);
        if (!gameId) {
            res.status(400).json(errorResponse('Invalid game ID'));
            return;
        }

        const item = await Wishlist.findOne({
            where: { user_id: userId, game_id: gameId },
            include: [
                { model: Platform, as: 'platform', attributes: ['id', 'name'] },
            ],
        });

        res.status(200).json(successResponse({
            in_wishlist: !!item,
            item: item || null,
        }));
    } catch (error) {
        console.error('Check wishlist status error:', error);
        res.status(500).json(errorResponse('Error checking wishlist status'));
    }
};

// ─── Wishlist Notifications ──────────────────────────────────────────

/**
 * Check for newly released wishlist games and notify users.
 * This is a background job function that can be called periodically.
 */
export const checkWishlistReleases = async (): Promise<{ notified: number }> => {
    let notified = 0;

    try {
        // Find games that were recently released (last 24h) and are in someone's wishlist
        const recentlyReleased = await sequelize.query<{
            wishlist_id: number; user_id: number; game_id: number; game_title: string;
        }>(
            `SELECT w.id as wishlist_id, w.user_id, w.game_id, g.title as game_title
             FROM wishlist w
             JOIN games g ON w.game_id = g.id
             WHERE g.release_status = 'released'
               AND g.release_date IS NOT NULL
               AND g.release_date >= CURRENT_DATE - INTERVAL '1 day'
               AND g.release_date <= CURRENT_DATE
               AND NOT EXISTS (
                 SELECT 1 FROM notifications n
                 WHERE n.user_id = w.user_id
                   AND n.game_id = w.game_id
                   AND n.notification_type = 'release'
                   AND n.created_at >= CURRENT_DATE - INTERVAL '7 days'
               )`,
            { type: QueryTypes.SELECT }
        );

        for (const entry of recentlyReleased) {
            try {
                await Notification.create({
                    user_id: entry.user_id,
                    notification_type: 'release',
                    game_id: entry.game_id,
                    title: 'Wishlist game released!',
                    message: `"${entry.game_title}" from your wishlist has been released! Check it out.`,
                } as any);
                notified++;
            } catch (err) {
                console.error(`Failed to notify user ${entry.user_id} about game ${entry.game_id}:`, err);
            }
        }

        console.log(`[WishlistNotifications] Notified ${notified} users about released wishlist games`);
    } catch (error) {
        console.error('[WishlistNotifications] Error checking wishlist releases:', error);
    }

    return { notified };
};

/**
 * Admin endpoint to trigger wishlist release check
 * POST /api/wishlist/admin/check-releases
 */
export const triggerWishlistCheck = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const result = await checkWishlistReleases();
        res.status(200).json(successResponse(result, 'Wishlist release check completed'));
    } catch (error) {
        console.error('Trigger wishlist check error:', error);
        res.status(500).json(errorResponse('Error checking wishlist releases'));
    }
};

/**
 * Export wishlist as CSV or JSON
 * GET /api/wishlist/export?format=csv|json
 */
export const exportWishlist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json(errorResponse('Not authenticated'));
            return;
        }

        const exportFormat = (req.query.format as string || 'csv').toLowerCase();
        if (!['csv', 'json'].includes(exportFormat)) {
            res.status(400).json(errorResponse('Supported formats: csv, json'));
            return;
        }

        const items = await sequelize.query<{
            id: number; game_title: string; platform_name: string; priority: string;
            max_price: string; notes: string; release_status: string; release_date: string; created_at: string;
        }>(
            `SELECT w.id, g.title as game_title, COALESCE(p.name, '') as platform_name,
                    w.priority, w.max_price, w.notes, g.release_status, g.release_date, w.created_at
             FROM wishlist w
             JOIN games g ON w.game_id = g.id
             LEFT JOIN platforms p ON w.platform_id = p.id
             WHERE w.user_id = :userId
             ORDER BY w.priority ASC, g.title ASC`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        if (exportFormat === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="gamevault_wishlist.json"');
            res.status(200).json({
                exported_at: new Date().toISOString(),
                total_items: items.length,
                wishlist: items,
            });
            return;
        }

        // CSV export
        const csvHeaders = [
            'ID', 'Game', 'Platform', 'Priority', 'Max Price',
            'Notes', 'Release Status', 'Release Date', 'Added At',
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
            item.priority,
            item.max_price || '',
            escapeCsv(item.notes),
            item.release_status || '',
            item.release_date || '',
            item.created_at,
        ].join(','));

        const csv = [csvHeaders.join(','), ...csvRows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="gamevault_wishlist.csv"');
        res.status(200).send(csv);
    } catch (error) {
        console.error('Export wishlist error:', error);
        res.status(500).json(errorResponse('Error exporting wishlist'));
    }
};
