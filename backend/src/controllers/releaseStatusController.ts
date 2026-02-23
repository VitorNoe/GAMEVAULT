import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import {
  Game, GameStatusHistory, Notification, Wishlist, User,
  Platform, Developer, GamePlatform,
} from '../models';
import type { NotificationType } from '../models/Notification';
import { AuthenticatedRequest } from '../middlewares/auth';
import {
  getPaginationParams,
  getPaginationResult,
  parseId,
} from '../utils/helpers';
import { catalogCache } from '../utils/cache';

// Valid release status values
const VALID_RELEASE_STATUSES = [
  'released', 'early_access', 'open_beta', 'closed_beta',
  'alpha', 'coming_soon', 'in_development', 'cancelled',
] as const;

const VALID_AVAILABILITY_STATUSES = [
  'available', 'out_of_catalog', 'expired_license', 'abandonware',
  'public_domain', 'discontinued', 'rereleased',
] as const;

// Human-readable status labels
const STATUS_LABELS: Record<string, string> = {
  released: 'Released',
  early_access: 'Early Access',
  open_beta: 'Open Beta',
  closed_beta: 'Closed Beta',
  alpha: 'Alpha',
  coming_soon: 'Coming Soon',
  in_development: 'In Development',
  cancelled: 'Cancelled',
  available: 'Available',
  out_of_catalog: 'Out of Catalog',
  expired_license: 'Expired License',
  abandonware: 'Abandonware',
  public_domain: 'Public Domain',
  discontinued: 'Discontinued',
  rereleased: 'Re-released',
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

interface CountdownInfo {
  release_date: string | null;
  days_until_release: number | null;
  is_released: boolean;
  countdown_label: string;
}

/**
 * Compute countdown info from a release date and status.
 */
function computeCountdown(
  releaseDate: Date | string | null | undefined,
  releaseStatus: string,
): CountdownInfo {
  const isReleased = releaseStatus === 'released';
  const releaseDateStr = releaseDate ? String(releaseDate) : null;

  if (!releaseDate || isReleased) {
    return {
      release_date: releaseDateStr,
      days_until_release: null,
      is_released: isReleased,
      countdown_label: isReleased ? 'Released' : 'TBA',
    };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Parse date string as local midnight to avoid UTC-vs-local offset issues
  const parts = String(releaseDate).split('-').map(Number);
  const target = new Date(parts[0], parts[1] - 1, parts[2]);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return {
      release_date: releaseDateStr,
      days_until_release: 0,
      is_released: false,
      countdown_label: 'Release day!',
    };
  }

  let label: string;
  if (diffDays === 1) {
    label = 'Tomorrow';
  } else if (diffDays <= 7) {
    label = `${diffDays} days`;
  } else if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7);
    label = `${weeks} week${weeks > 1 ? 's' : ''}`;
  } else if (diffDays <= 365) {
    const months = Math.floor(diffDays / 30);
    label = `${months} month${months > 1 ? 's' : ''}`;
  } else {
    const years = Math.floor(diffDays / 365);
    label = `${years} year${years > 1 ? 's' : ''}`;
  }

  return {
    release_date: releaseDateStr,
    days_until_release: diffDays,
    is_released: false,
    countdown_label: label,
  };
}

/**
 * Send notifications to users who wishlisted a game when its status changes.
 */
async function notifyWishlistedUsers(
  gameId: number,
  gameTitle: string,
  oldStatus: string,
  newStatus: string,
  type: 'release_status' | 'availability_status',
): Promise<number> {
  // Find all users who have this game in their wishlist
  const wishlistEntries = await Wishlist.findAll({
    where: { game_id: gameId },
    attributes: ['user_id'],
    group: ['user_id'],
    raw: true,
  });

  if (wishlistEntries.length === 0) return 0;

  const userIds = wishlistEntries.map((w: any) => w.user_id);
  const oldLabel = STATUS_LABELS[oldStatus] || oldStatus;
  const newLabel = STATUS_LABELS[newStatus] || newStatus;

  const notifType: NotificationType = newStatus === 'released' ? 'release' : 'status_change';
  const title = newStatus === 'released'
    ? `🎮 ${gameTitle} has been released!`
    : `📢 ${gameTitle} status changed`;

  const message = newStatus === 'released'
    ? `Great news! "${gameTitle}" from your wishlist is now available. The game has been officially released.`
    : `"${gameTitle}" from your wishlist changed ${type === 'release_status' ? 'release status' : 'availability'} from "${oldLabel}" to "${newLabel}".`;

  const notifications = userIds.map((uid: number) => ({
    user_id: uid,
    notification_type: notifType,
    game_id: gameId,
    title,
    message,
    is_read: false,
  }));

  await Notification.bulkCreate(notifications);
  return notifications.length;
}

// ──────────────────────────────────────────────
// PUT /api/games/:id/status  – Change release/availability status (admin)
// ──────────────────────────────────────────────

export const changeGameStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const gameId = parseId(req.params.id);
    if (!gameId) {
      res.status(400).json({ success: false, message: 'Invalid game ID.' });
      return;
    }

    const game = await Game.findByPk(gameId);
    if (!game) {
      res.status(404).json({ success: false, message: 'Game not found.' });
      return;
    }

    const { release_status, availability_status, reason } = req.body;

    // Validate at least one status is provided
    if (!release_status && !availability_status) {
      res.status(400).json({
        success: false,
        message: 'At least one of release_status or availability_status is required.',
      });
      return;
    }

    // Validate release_status
    if (release_status && !VALID_RELEASE_STATUSES.includes(release_status)) {
      res.status(400).json({
        success: false,
        message: `Invalid release_status. Valid values: ${VALID_RELEASE_STATUSES.join(', ')}`,
      });
      return;
    }

    // Validate availability_status
    if (availability_status && !VALID_AVAILABILITY_STATUSES.includes(availability_status)) {
      res.status(400).json({
        success: false,
        message: `Invalid availability_status. Valid values: ${VALID_AVAILABILITY_STATUSES.join(', ')}`,
      });
      return;
    }

    // Capture previous values
    const prevReleaseStatus = game.release_status;
    const prevAvailabilityStatus = game.availability_status;

    // Check if anything actually changed
    const releaseChanged = release_status && release_status !== prevReleaseStatus;
    const availChanged = availability_status && availability_status !== prevAvailabilityStatus;

    if (!releaseChanged && !availChanged) {
      res.status(200).json({
        success: true,
        message: 'No status change detected.',
        data: { game },
      });
      return;
    }

    // Update the game
    if (releaseChanged) game.release_status = release_status;
    if (availChanged) game.availability_status = availability_status;
    await game.save();

    // Record history
    const historyEntry = await GameStatusHistory.create({
      game_id: gameId,
      changed_by: req.user?.id,
      previous_release_status: releaseChanged ? prevReleaseStatus : undefined,
      new_release_status: releaseChanged ? release_status : undefined,
      previous_availability_status: availChanged ? prevAvailabilityStatus : undefined,
      new_availability_status: availChanged ? availability_status : undefined,
      change_reason: reason || null,
    });

    // Send notifications to wishlisted users
    let notificationCount = 0;
    if (releaseChanged) {
      notificationCount += await notifyWishlistedUsers(
        gameId, game.title, prevReleaseStatus, release_status, 'release_status',
      );
    }
    if (availChanged) {
      notificationCount += await notifyWishlistedUsers(
        gameId, game.title, prevAvailabilityStatus, availability_status, 'availability_status',
      );
    }

    // Invalidate caches
    catalogCache.invalidatePrefix('catalog:');
    catalogCache.del(`game:${gameId}`);

    res.status(200).json({
      success: true,
      message: 'Game status updated successfully.',
      data: {
        game,
        history_entry: historyEntry,
        notifications_sent: notificationCount,
      },
    });
  } catch (error) {
    console.error('Change game status error:', error);
    res.status(500).json({ success: false, message: 'Error updating game status.' });
  }
};

// ──────────────────────────────────────────────
// GET /api/games/:id/status-history  – Fetch status change history
// ──────────────────────────────────────────────

export const getGameStatusHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const gameId = parseId(req.params.id);
    if (!gameId) {
      res.status(400).json({ success: false, message: 'Invalid game ID.' });
      return;
    }

    const game = await Game.findByPk(gameId, { attributes: ['id', 'title', 'slug', 'release_status', 'availability_status'] });
    if (!game) {
      res.status(404).json({ success: false, message: 'Game not found.' });
      return;
    }

    const { page, limit, offset } = getPaginationParams(req);

    const { count, rows: history } = await GameStatusHistory.findAndCountAll({
      where: { game_id: gameId },
      include: [
        {
          model: User,
          as: 'changedByUser',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['changed_at', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      data: {
        game: game.toJSON(),
        history,
        pagination: getPaginationResult(count, page, limit),
      },
    });
  } catch (error) {
    console.error('Get game status history error:', error);
    res.status(500).json({ success: false, message: 'Error fetching status history.' });
  }
};

// ──────────────────────────────────────────────
// GET /api/games/:id/countdown  – Release countdown for a game
// ──────────────────────────────────────────────

export const getGameCountdown = async (req: Request, res: Response): Promise<void> => {
  try {
    const gameId = parseId(req.params.id);
    if (!gameId) {
      res.status(400).json({ success: false, message: 'Invalid game ID.' });
      return;
    }

    const game = await Game.findByPk(gameId, {
      attributes: ['id', 'title', 'slug', 'release_date', 'release_status', 'cover_url'],
    });
    if (!game) {
      res.status(404).json({ success: false, message: 'Game not found.' });
      return;
    }

    const countdown = computeCountdown(game.release_date, game.release_status);

    res.status(200).json({
      success: true,
      data: {
        game: {
          id: game.id,
          title: game.title,
          slug: game.slug,
          cover_url: game.cover_url,
          release_status: game.release_status,
        },
        countdown,
      },
    });
  } catch (error) {
    console.error('Get game countdown error:', error);
    res.status(500).json({ success: false, message: 'Error fetching countdown.' });
  }
};

// ──────────────────────────────────────────────
// GET /api/games/upcoming-countdown  – Upcoming releases with countdowns
// ──────────────────────────────────────────────

export const getUpcomingWithCountdowns = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationParams(req);
    const today = new Date().toISOString().split('T')[0];

    const { count, rows: games } = await Game.findAndCountAll({
      where: {
        [Op.or]: [
          { release_status: { [Op.in]: ['coming_soon', 'in_development', 'alpha', 'closed_beta', 'open_beta', 'early_access'] } },
          {
            release_date: { [Op.gt]: today },
            release_status: { [Op.ne]: 'cancelled' },
          },
        ],
      },
      include: [
        { model: Developer, as: 'developer', attributes: ['id', 'name', 'slug'] },
        {
          model: Platform, as: 'platforms',
          attributes: ['id', 'name', 'slug', 'type'],
          through: { attributes: ['platform_release_date'] },
        },
      ],
      attributes: [
        'id', 'title', 'slug', 'cover_url', 'release_date', 'release_year',
        'release_status', 'metacritic_score', 'developer_id',
      ],
      limit,
      offset,
      order: [['release_date', 'ASC NULLS LAST']],
      distinct: true,
      subQuery: false,
    });

    const gamesWithCountdowns = games.map(g => {
      const game = g.toJSON() as any;
      const countdown = computeCountdown(game.release_date, game.release_status);
      return { ...game, countdown };
    });

    res.status(200).json({
      success: true,
      data: {
        games: gamesWithCountdowns,
        pagination: getPaginationResult(count, page, limit),
      },
    });
  } catch (error) {
    console.error('Get upcoming with countdowns error:', error);
    res.status(500).json({ success: false, message: 'Error fetching upcoming releases.' });
  }
};

// ──────────────────────────────────────────────
// GET /api/games/release-timeline  – Timeline of recent and upcoming status changes
// ──────────────────────────────────────────────

export const getReleaseTimeline = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationParams(req);

    // Optional filter: only release_status changes (exclude availability changes)
    const typeFilter = req.query.type as string;

    const where: Record<string, any> = {};
    if (typeFilter === 'release') {
      where.new_release_status = { [Op.ne]: null };
    } else if (typeFilter === 'availability') {
      where.new_availability_status = { [Op.ne]: null };
    }

    const { count, rows: timeline } = await GameStatusHistory.findAndCountAll({
      where,
      include: [
        {
          model: Game,
          as: 'game',
          attributes: ['id', 'title', 'slug', 'cover_url', 'release_date', 'release_status'],
        },
        {
          model: User,
          as: 'changedByUser',
          attributes: ['id', 'name'],
        },
      ],
      order: [['changed_at', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      data: {
        timeline,
        pagination: getPaginationResult(count, page, limit),
      },
    });
  } catch (error) {
    console.error('Get release timeline error:', error);
    res.status(500).json({ success: false, message: 'Error fetching release timeline.' });
  }
};

// ──────────────────────────────────────────────
// Exported: computeCountdown for use in periodic job
// ──────────────────────────────────────────────
export { computeCountdown, notifyWishlistedUsers };
