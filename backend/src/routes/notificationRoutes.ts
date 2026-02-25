import { Router } from 'express';
import {
  getNotifications,
  unreadCount,
  markRead,
  markAllRead,
  removeNotification,
  getSettings,
  updateMaster,
  updatePreference,
  bulkUpdate,
  adminSendTest,
} from '../controllers/notificationController';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import { generalLimiter, createLimiter } from '../middlewares/rateLimiter';

const router = Router();

// ─── Admin routes (before parameterized) ─────────────────────────────

/**
 * @openapi
 * /notifications/admin/test:
 *   post:
 *     tags: [Notifications]
 *     summary: Send a test notification
 *     description: Admin only. Sends a test notification to a user for debugging.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id]
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 1
 *               title:
 *                 type: string
 *                 example: "Test notification"
 *               body:
 *                 type: string
 *     responses:
 *       200:
 *         description: Test notification sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/admin/test', createLimiter, authenticate, authorizeAdmin, adminSendTest);

// ─── Settings (before /:id) ──────────────────────────────────────────

/**
 * @openapi
 * /notifications/settings:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notification preferences
 *     description: Returns all notification preferences for the current user.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Notification settings
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/settings', generalLimiter, authenticate, getSettings);

/**
 * @openapi
 * /notifications/settings/master:
 *   put:
 *     tags: [Notifications]
 *     summary: Update master channel toggles
 *     description: Toggle in_app, email, push notification channels globally.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               in_app:
 *                 type: boolean
 *               email:
 *                 type: boolean
 *               push:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Master settings updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/settings/master', generalLimiter, authenticate, updateMaster);

/**
 * @openapi
 * /notifications/settings/bulk:
 *   put:
 *     tags: [Notifications]
 *     summary: Bulk update notification preferences
 *     description: Update preferences for multiple notification types at once.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferences:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     in_app:
 *                       type: boolean
 *                     email:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/settings/bulk', generalLimiter, authenticate, bulkUpdate);

/**
 * @openapi
 * /notifications/settings/{type}:
 *   put:
 *     tags: [Notifications]
 *     summary: Update preference for a notification type
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification type key (e.g. wishlist_release, review_like)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               in_app:
 *                 type: boolean
 *               email:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preference updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/settings/:type', generalLimiter, authenticate, updatePreference);

// ─── Notifications CRUD ──────────────────────────────────────────────

/**
 * @openapi
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread notification count
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 5
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/unread-count', generalLimiter, authenticate, unreadCount);

/**
 * @openapi
 * /notifications/read-all:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/read-all', generalLimiter, authenticate, markAllRead);

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get paginated notifications
 *     description: Returns the user's notifications with filtering options.
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
 *       - in: query
 *         name: unread_only
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Notifications list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', generalLimiter, authenticate, getNotifications);

/**
 * @openapi
 * /notifications/{id}/read:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark a notification as read
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
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id/read', generalLimiter, authenticate, markRead);

/**
 * @openapi
 * /notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a notification
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
 *         description: Notification deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', generalLimiter, authenticate, removeNotification);

export default router;
