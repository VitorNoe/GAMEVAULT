import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import {
  successResponse,
  errorResponse,
  getPaginationParams,
  getPaginationResult,
  parseId,
} from '../utils/helpers';

// Admin service (user management)
import {
  listUsers,
  getUserDetail,
  changeUserRole,
  banUser,
  unbanUser,
  adminDeleteUser,
  getActivityLogs,
} from '../services/adminService';

// Moderation service
import {
  moderateReview,
  listReviewsForModeration,
  adminRemoveGame,
  adminHardDeleteReview,
  getModerationActions,
} from '../services/moderationService';

// Reports service
import {
  getDashboardStats,
  getTopGames,
  getMostReviewedGames,
  getMostActiveUsers,
  getRereleaseRequestsSummary,
  getUserRegistrationTrend,
  getReviewTrend,
} from '../services/reportsService';

// ═══════════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

/**
 * List all users with filters.
 * GET /api/admin/users
 * Query: search, type, is_banned, email_verified, page, limit
 */
export const adminListUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationParams(req);

    const filters = {
      search: req.query.search as string | undefined,
      type: req.query.type as 'regular' | 'admin' | undefined,
      isBanned: req.query.is_banned !== undefined ? req.query.is_banned === 'true' : undefined,
      emailVerified: req.query.email_verified !== undefined ? req.query.email_verified === 'true' : undefined,
    };

    const { rows, count } = await listUsers(filters, limit, offset);
    const pagination = getPaginationResult(count, page, limit);

    res.json(successResponse({ users: rows, pagination }));
  } catch (error: any) {
    console.error('Admin list users error:', error);
    res.status(500).json(errorResponse('Error listing users'));
  }
};

/**
 * Get single user detail (admin view).
 * GET /api/admin/users/:id
 */
export const adminGetUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json(errorResponse('Invalid user ID')); return; }

    const user = await getUserDetail(id);
    if (!user) { res.status(404).json(errorResponse('User not found')); return; }

    res.json(successResponse(user));
  } catch (error: any) {
    console.error('Admin get user error:', error);
    res.status(500).json(errorResponse('Error fetching user'));
  }
};

/**
 * Change a user's role.
 * PUT /api/admin/users/:id/role
 * Body: { role: 'regular' | 'admin' }
 */
export const adminChangeRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const targetId = parseId(req.params.id);
    if (!targetId) { res.status(400).json(errorResponse('Invalid user ID')); return; }

    const { role } = req.body;
    if (!role || !['regular', 'admin'].includes(role)) {
      res.status(400).json(errorResponse('role must be "regular" or "admin"'));
      return;
    }

    const user = await changeUserRole(targetId, role, adminId);
    res.json(successResponse(user, `Role changed to ${role}`));
  } catch (error: any) {
    console.error('Admin change role error:', error);
    const status = error.status || 500;
    res.status(status).json(errorResponse(error.message || 'Error changing role'));
  }
};

/**
 * Ban a user.
 * POST /api/admin/users/:id/ban
 * Body: { reason?: string }
 */
export const adminBanUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const targetId = parseId(req.params.id);
    if (!targetId) { res.status(400).json(errorResponse('Invalid user ID')); return; }

    const user = await banUser(targetId, adminId, req.body.reason);
    res.json(successResponse(user, 'User banned'));
  } catch (error: any) {
    console.error('Admin ban user error:', error);
    const status = error.status || 500;
    res.status(status).json(errorResponse(error.message || 'Error banning user'));
  }
};

/**
 * Unban a user.
 * POST /api/admin/users/:id/unban
 */
export const adminUnbanUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const targetId = parseId(req.params.id);
    if (!targetId) { res.status(400).json(errorResponse('Invalid user ID')); return; }

    const user = await unbanUser(targetId, adminId);
    res.json(successResponse(user, 'User unbanned'));
  } catch (error: any) {
    console.error('Admin unban user error:', error);
    const status = error.status || 500;
    res.status(status).json(errorResponse(error.message || 'Error unbanning user'));
  }
};

/**
 * Hard-delete a user.
 * DELETE /api/admin/users/:id
 */
export const adminRemoveUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const targetId = parseId(req.params.id);
    if (!targetId) { res.status(400).json(errorResponse('Invalid user ID')); return; }

    await adminDeleteUser(targetId, adminId);
    res.json(successResponse(null, 'User deleted'));
  } catch (error: any) {
    console.error('Admin delete user error:', error);
    const status = error.status || 500;
    res.status(status).json(errorResponse(error.message || 'Error deleting user'));
  }
};

// ═══════════════════════════════════════════════════════════════════════
// CONTENT MODERATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * List reviews for moderation.
 * GET /api/admin/moderation/reviews
 * Query: status, game_id, user_id, page, limit
 */
export const adminListReviews = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationParams(req);

    const filters = {
      status: req.query.status as string | undefined,
      gameId: req.query.game_id ? parseInt(req.query.game_id as string, 10) : undefined,
      userId: req.query.user_id ? parseInt(req.query.user_id as string, 10) : undefined,
    };

    const { rows, count } = await listReviewsForModeration(filters, limit, offset);
    const pagination = getPaginationResult(count, page, limit);

    res.json(successResponse({ reviews: rows, pagination }));
  } catch (error: any) {
    console.error('Admin list reviews error:', error);
    res.status(500).json(errorResponse('Error listing reviews'));
  }
};

/**
 * Moderate a review (approve / flag / remove).
 * PUT /api/admin/moderation/reviews/:id
 * Body: { action: 'approve' | 'flag' | 'remove', reason?: string }
 */
export const adminModerateReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const reviewId = parseId(req.params.id);
    if (!reviewId) { res.status(400).json(errorResponse('Invalid review ID')); return; }

    const { action, reason } = req.body;
    if (!action || !['approve', 'flag', 'remove'].includes(action)) {
      res.status(400).json(errorResponse('action must be "approve", "flag", or "remove"'));
      return;
    }

    const review = await moderateReview(reviewId, action, adminId, reason);
    res.json(successResponse(review, `Review ${action}d`));
  } catch (error: any) {
    console.error('Admin moderate review error:', error);
    const status = error.status || 500;
    res.status(status).json(errorResponse(error.message || 'Error moderating review'));
  }
};

/**
 * Hard-delete a review (with cleanup).
 * DELETE /api/admin/moderation/reviews/:id
 * Body: { reason?: string }
 */
export const adminDeleteReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const reviewId = parseId(req.params.id);
    if (!reviewId) { res.status(400).json(errorResponse('Invalid review ID')); return; }

    await adminHardDeleteReview(reviewId, adminId, req.body.reason);
    res.json(successResponse(null, 'Review deleted'));
  } catch (error: any) {
    console.error('Admin delete review error:', error);
    const status = error.status || 500;
    res.status(status).json(errorResponse(error.message || 'Error deleting review'));
  }
};

/**
 * Remove a game (hard delete with audit log).
 * DELETE /api/admin/moderation/games/:id
 * Body: { reason?: string }
 */
export const adminDeleteGame = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const gameId = parseId(req.params.id);
    if (!gameId) { res.status(400).json(errorResponse('Invalid game ID')); return; }

    await adminRemoveGame(gameId, adminId, req.body.reason);
    res.json(successResponse(null, 'Game removed'));
  } catch (error: any) {
    console.error('Admin delete game error:', error);
    const status = error.status || 500;
    res.status(status).json(errorResponse(error.message || 'Error removing game'));
  }
};

// ═══════════════════════════════════════════════════════════════════════
// ACTIVITY LOGS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get all activity logs.
 * GET /api/admin/activity-logs
 * Query: activity_type, entity_type, user_id, page, limit
 */
export const adminGetActivityLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationParams(req);

    const filters = {
      activityType: req.query.activity_type as string | undefined,
      entityType: req.query.entity_type as string | undefined,
      userId: req.query.user_id ? parseInt(req.query.user_id as string, 10) : undefined,
    };

    const { rows, count } = await getActivityLogs(filters, limit, offset);
    const pagination = getPaginationResult(count, page, limit);

    res.json(successResponse({ logs: rows, pagination }));
  } catch (error: any) {
    console.error('Activity logs error:', error);
    res.status(500).json(errorResponse('Error fetching activity logs'));
  }
};

/**
 * Get admin moderation action history.
 * GET /api/admin/moderation/log
 * Query: entity_type, admin_id, page, limit
 */
export const adminGetModerationLog = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationParams(req);

    const filters = {
      entityType: req.query.entity_type as string | undefined,
      adminId: req.query.admin_id ? parseInt(req.query.admin_id as string, 10) : undefined,
    };

    const { rows, count } = await getModerationActions(filters, limit, offset);
    const pagination = getPaginationResult(count, page, limit);

    res.json(successResponse({ actions: rows, pagination }));
  } catch (error: any) {
    console.error('Moderation log error:', error);
    res.status(500).json(errorResponse('Error fetching moderation log'));
  }
};

// ═══════════════════════════════════════════════════════════════════════
// REPORTS & STATISTICS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Dashboard overview with aggregate stats.
 * GET /api/admin/reports/dashboard
 */
export const adminDashboard = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const stats = await getDashboardStats();
    res.json(successResponse(stats));
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    res.status(500).json(errorResponse('Error fetching dashboard stats'));
  }
};

/**
 * Top-rated games.
 * GET /api/admin/reports/top-games
 * Query: limit (default 10)
 */
export const adminTopGames = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const games = await getTopGames(Math.min(limit, 50));
    res.json(successResponse(games));
  } catch (error: any) {
    console.error('Top games error:', error);
    res.status(500).json(errorResponse('Error fetching top games'));
  }
};

/**
 * Most reviewed games.
 * GET /api/admin/reports/most-reviewed
 */
export const adminMostReviewed = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const games = await getMostReviewedGames(Math.min(limit, 50));
    res.json(successResponse(games));
  } catch (error: any) {
    console.error('Most reviewed error:', error);
    res.status(500).json(errorResponse('Error fetching most reviewed games'));
  }
};

/**
 * Most active users.
 * GET /api/admin/reports/active-users
 */
export const adminActiveUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const users = await getMostActiveUsers(Math.min(limit, 50));
    res.json(successResponse(users));
  } catch (error: any) {
    console.error('Active users error:', error);
    res.status(500).json(errorResponse('Error fetching active users'));
  }
};

/**
 * Rerelease requests summary.
 * GET /api/admin/reports/rereleases
 */
export const adminRereleasesSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const requests = await getRereleaseRequestsSummary(Math.min(limit, 100));
    res.json(successResponse(requests));
  } catch (error: any) {
    console.error('Rereleases summary error:', error);
    res.status(500).json(errorResponse('Error fetching rerelease summary'));
  }
};

/**
 * User registration trend (last 12 months).
 * GET /api/admin/reports/registration-trend
 */
export const adminRegistrationTrend = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const trend = await getUserRegistrationTrend();
    res.json(successResponse(trend));
  } catch (error: any) {
    console.error('Registration trend error:', error);
    res.status(500).json(errorResponse('Error fetching registration trend'));
  }
};

/**
 * Review trend (last 12 months).
 * GET /api/admin/reports/review-trend
 */
export const adminReviewTrend = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const trend = await getReviewTrend();
    res.json(successResponse(trend));
  } catch (error: any) {
    console.error('Review trend error:', error);
    res.status(500).json(errorResponse('Error fetching review trend'));
  }
};
