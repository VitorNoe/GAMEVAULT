import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import { generalLimiter, createLimiter } from '../middlewares/rateLimiter';
import {
  // User management
  adminListUsers,
  adminGetUser,
  adminChangeRole,
  adminBanUser,
  adminUnbanUser,
  adminRemoveUser,
  // Content moderation
  adminListReviews,
  adminModerateReview,
  adminDeleteReview,
  adminDeleteGame,
  // Activity & moderation logs
  adminGetActivityLogs,
  adminGetModerationLog,
  // Reports & statistics
  adminDashboard,
  adminTopGames,
  adminMostReviewed,
  adminActiveUsers,
  adminRereleasesSummary,
  adminRegistrationTrend,
  adminReviewTrend,
} from '../controllers/adminController';

const router = Router();

// All routes require authentication + admin role
router.use(authenticate, authorizeAdmin);

// ═══════════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

/**
 * @route GET /api/admin/users
 * @desc List all users with filters (search, type, banned, verified)
 * @access Admin
 */
router.get('/users', generalLimiter, adminListUsers);

/**
 * @route GET /api/admin/users/:id
 * @desc Get single user detail
 * @access Admin
 */
router.get('/users/:id', generalLimiter, adminGetUser);

/**
 * @route PUT /api/admin/users/:id/role
 * @desc Change user role (regular ↔ admin)
 * @access Admin
 */
router.put('/users/:id/role', createLimiter, adminChangeRole);

/**
 * @route POST /api/admin/users/:id/ban
 * @desc Ban a user
 * @access Admin
 */
router.post('/users/:id/ban', createLimiter, adminBanUser);

/**
 * @route POST /api/admin/users/:id/unban
 * @desc Unban a user
 * @access Admin
 */
router.post('/users/:id/unban', createLimiter, adminUnbanUser);

/**
 * @route DELETE /api/admin/users/:id
 * @desc Hard-delete a user account
 * @access Admin
 */
router.delete('/users/:id', createLimiter, adminRemoveUser);

// ═══════════════════════════════════════════════════════════════════════
// CONTENT MODERATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * @route GET /api/admin/moderation/reviews
 * @desc List reviews with moderation filters
 * @access Admin
 */
router.get('/moderation/reviews', generalLimiter, adminListReviews);

/**
 * @route PUT /api/admin/moderation/reviews/:id
 * @desc Moderate a review (approve / flag / remove)
 * @access Admin
 */
router.put('/moderation/reviews/:id', createLimiter, adminModerateReview);

/**
 * @route DELETE /api/admin/moderation/reviews/:id
 * @desc Hard-delete a review
 * @access Admin
 */
router.delete('/moderation/reviews/:id', createLimiter, adminDeleteReview);

/**
 * @route DELETE /api/admin/moderation/games/:id
 * @desc Remove a game from the catalog
 * @access Admin
 */
router.delete('/moderation/games/:id', createLimiter, adminDeleteGame);

/**
 * @route GET /api/admin/moderation/log
 * @desc Admin moderation action history
 * @access Admin
 */
router.get('/moderation/log', generalLimiter, adminGetModerationLog);

// ═══════════════════════════════════════════════════════════════════════
// ACTIVITY LOGS
// ═══════════════════════════════════════════════════════════════════════

/**
 * @route GET /api/admin/activity-logs
 * @desc All activity logs (filterable by type, entity, user)
 * @access Admin
 */
router.get('/activity-logs', generalLimiter, adminGetActivityLogs);

// ═══════════════════════════════════════════════════════════════════════
// REPORTS & STATISTICS
// ═══════════════════════════════════════════════════════════════════════

/**
 * @route GET /api/admin/reports/dashboard
 * @desc Dashboard overview with aggregate stats
 * @access Admin
 */
router.get('/reports/dashboard', generalLimiter, adminDashboard);

/**
 * @route GET /api/admin/reports/top-games
 * @desc Top-rated games
 * @access Admin
 */
router.get('/reports/top-games', generalLimiter, adminTopGames);

/**
 * @route GET /api/admin/reports/most-reviewed
 * @desc Most reviewed games
 * @access Admin
 */
router.get('/reports/most-reviewed', generalLimiter, adminMostReviewed);

/**
 * @route GET /api/admin/reports/active-users
 * @desc Most active users (by reviews + activity)
 * @access Admin
 */
router.get('/reports/active-users', generalLimiter, adminActiveUsers);

/**
 * @route GET /api/admin/reports/rereleases
 * @desc Rerelease request summary (by votes)
 * @access Admin
 */
router.get('/reports/rereleases', generalLimiter, adminRereleasesSummary);

/**
 * @route GET /api/admin/reports/registration-trend
 * @desc User registration trend (last 12 months)
 * @access Admin
 */
router.get('/reports/registration-trend', generalLimiter, adminRegistrationTrend);

/**
 * @route GET /api/admin/reports/review-trend
 * @desc Review trend (last 12 months: count + avg rating)
 * @access Admin
 */
router.get('/reports/review-trend', generalLimiter, adminReviewTrend);

export default router;
