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
 * @route POST /api/notifications/admin/test
 * @desc Send a test notification to a user (for debugging / PoC)
 * @access Admin
 */
router.post('/admin/test', createLimiter, authenticate, authorizeAdmin, adminSendTest);

// ─── Settings (before /:id) ──────────────────────────────────────────

/**
 * @route GET /api/notifications/settings
 * @desc Get all notification preferences for current user
 * @access Private
 */
router.get('/settings', generalLimiter, authenticate, getSettings);

/**
 * @route PUT /api/notifications/settings/master
 * @desc Update master channel toggles (in_app, email, push)
 * @access Private
 */
router.put('/settings/master', generalLimiter, authenticate, updateMaster);

/**
 * @route PUT /api/notifications/settings/bulk
 * @desc Bulk-update preferences for multiple notification types
 * @access Private
 */
router.put('/settings/bulk', generalLimiter, authenticate, bulkUpdate);

/**
 * @route PUT /api/notifications/settings/:type
 * @desc Update preference for a single notification type
 * @access Private
 */
router.put('/settings/:type', generalLimiter, authenticate, updatePreference);

// ─── Notifications CRUD ──────────────────────────────────────────────

/**
 * @route GET /api/notifications/unread-count
 * @desc Get unread notification count
 * @access Private
 */
router.get('/unread-count', generalLimiter, authenticate, unreadCount);

/**
 * @route PUT /api/notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.put('/read-all', generalLimiter, authenticate, markAllRead);

/**
 * @route GET /api/notifications
 * @desc Get paginated list of notifications (?page=1&limit=20&unread_only=true)
 * @access Private
 */
router.get('/', generalLimiter, authenticate, getNotifications);

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark a single notification as read
 * @access Private
 */
router.put('/:id/read', generalLimiter, authenticate, markRead);

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete a notification
 * @access Private
 */
router.delete('/:id', generalLimiter, authenticate, removeNotification);

export default router;
