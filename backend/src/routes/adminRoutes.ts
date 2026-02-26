import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import { generalLimiter, createLimiter } from '../middlewares/rateLimiter';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate';
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
  // Report exports
  adminExportReport,
  adminExportDashboard,
} from '../controllers/adminController';

const router = Router();

// All routes require authentication + admin role
router.use(authenticate, authorizeAdmin);

// ═══════════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users
 *     description: Search, filter, and paginate users. Supports search, type, banned, and verified filters.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *       - in: query
 *         name: banned
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Users list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/users', generalLimiter, adminListUsers);

/**
 * @openapi
 * /admin/users/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get single user detail
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/users/:id', generalLimiter, adminGetUser);

/**
 * @openapi
 * /admin/users/{id}/role:
 *   put:
 *     tags: [Admin]
 *     summary: Change user role
 *     description: Toggle between regular and admin roles.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: Role changed
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put(
  '/users/:id/role',
  createLimiter,
  [
    body('role')
      .notEmpty().withMessage('Role is required')
      .isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  ],
  validate,
  adminChangeRole
);

/**
 * @openapi
 * /admin/users/{id}/ban:
 *   post:
 *     tags: [Admin]
 *     summary: Ban a user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User banned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/users/:id/ban', createLimiter, adminBanUser);

/**
 * @openapi
 * /admin/users/{id}/unban:
 *   post:
 *     tags: [Admin]
 *     summary: Unban a user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User unbanned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/users/:id/unban', createLimiter, adminUnbanUser);

/**
 * @openapi
 * /admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Hard-delete a user account
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete('/users/:id', createLimiter, adminRemoveUser);

// ═══════════════════════════════════════════════════════════════════════
// CONTENT MODERATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * @openapi
 * /admin/moderation/reviews:
 *   get:
 *     tags: [Admin]
 *     summary: List reviews with moderation filters
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: flagged
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Reviews list
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/moderation/reviews', generalLimiter, adminListReviews);

/**
 * @openapi
 * /admin/moderation/reviews/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Moderate a review
 *     description: Approve, flag, or remove a review.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, flag, remove]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review moderated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   delete:
 *     tags: [Admin]
 *     summary: Hard-delete a review
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Review deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put(
  '/moderation/reviews/:id',
  createLimiter,
  [
    body('action')
      .notEmpty().withMessage('Action is required')
      .isIn(['approve', 'flag', 'remove']).withMessage('Action must be approve, flag, or remove'),
    body('reason').optional().isLength({ max: 500 }).withMessage('Reason must be at most 500 characters'),
  ],
  validate,
  adminModerateReview
);

router.delete('/moderation/reviews/:id', createLimiter, adminDeleteReview);

/**
 * @openapi
 * /admin/moderation/games/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Remove a game from the catalog
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Game removed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete('/moderation/games/:id', createLimiter, adminDeleteGame);

/**
 * @openapi
 * /admin/moderation/log:
 *   get:
 *     tags: [Admin]
 *     summary: Admin moderation action history
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Moderation log
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/moderation/log', generalLimiter, adminGetModerationLog);

// ═══════════════════════════════════════════════════════════════════════
// ACTIVITY LOGS
// ═══════════════════════════════════════════════════════════════════════

/**
 * @openapi
 * /admin/activity-logs:
 *   get:
 *     tags: [Admin]
 *     summary: Get all activity logs
 *     description: Filterable by type, entity, and user.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: entity_type
 *         schema:
 *           type: string
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Activity logs
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/activity-logs', generalLimiter, adminGetActivityLogs);

// ═══════════════════════════════════════════════════════════════════════
// REPORTS & STATISTICS
// ═══════════════════════════════════════════════════════════════════════

/**
 * @openapi
 * /admin/reports/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Dashboard overview with aggregate stats
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/reports/dashboard', generalLimiter, adminDashboard);

/**
 * @openapi
 * /admin/reports/top-games:
 *   get:
 *     tags: [Admin]
 *     summary: Top-rated games
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Top games
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/reports/top-games', generalLimiter, adminTopGames);

/**
 * @openapi
 * /admin/reports/most-reviewed:
 *   get:
 *     tags: [Admin]
 *     summary: Most reviewed games
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Most reviewed games
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/reports/most-reviewed', generalLimiter, adminMostReviewed);

/**
 * @openapi
 * /admin/reports/active-users:
 *   get:
 *     tags: [Admin]
 *     summary: Most active users
 *     description: Users ranked by reviews and activity.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Active users
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/reports/active-users', generalLimiter, adminActiveUsers);

/**
 * @openapi
 * /admin/reports/rereleases:
 *   get:
 *     tags: [Admin]
 *     summary: Re-release request summary
 *     description: Requests grouped by votes.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Re-release summary
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/reports/rereleases', generalLimiter, adminRereleasesSummary);

/**
 * @openapi
 * /admin/reports/registration-trend:
 *   get:
 *     tags: [Admin]
 *     summary: User registration trend
 *     description: Monthly registration count for the last 12 months.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Registration trend data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/reports/registration-trend', generalLimiter, adminRegistrationTrend);

/**
 * @openapi
 * /admin/reports/review-trend:
 *   get:
 *     tags: [Admin]
 *     summary: Review trend
 *     description: Monthly review count and average rating for the last 12 months.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Review trend data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/reports/review-trend', generalLimiter, adminReviewTrend);

// ═══════════════════════════════════════════════════════════════════════
// REPORT EXPORTS (CSV / PDF)
// ═══════════════════════════════════════════════════════════════════════

/**
 * @openapi
 * /admin/reports/export/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Export dashboard overview as CSV or PDF
 *     description: Download the platform dashboard stats in CSV or PDF format.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, pdf]
 *           default: csv
 *     responses:
 *       200:
 *         description: File download
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/reports/export/dashboard', generalLimiter, adminExportDashboard);

/**
 * @openapi
 * /admin/reports/export/{report}:
 *   get:
 *     tags: [Admin]
 *     summary: Export an admin report as CSV or PDF
 *     description: |
 *       Available reports: top-games, most-reviewed, active-users, rereleases, registration-trend, review-trend.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: report
 *         required: true
 *         schema:
 *           type: string
 *           enum: [top-games, most-reviewed, active-users, rereleases, registration-trend, review-trend]
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, pdf]
 *           default: csv
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: File download
 *       400:
 *         description: Unknown report
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/reports/export/:report', generalLimiter, adminExportReport);

export default router;
