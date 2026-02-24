import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getUnreadCount,
  getUserPreferences,
  updateUserPreference,
  bulkUpdatePreferences,
  updateMasterToggles,
  emitNotification,
  ALL_NOTIFICATION_TYPES,
} from '../services/notificationService';
import { getQueueDepth } from '../services/notificationQueue';
import {
  getPaginationParams,
  getPaginationResult,
  parseId,
  successResponse,
  errorResponse,
} from '../utils/helpers';

// ─── In-app notifications ────────────────────────────────────────────

/**
 * Get current user's notifications (paginated).
 * GET /api/notifications
 * Query: ?page=1&limit=20&unread_only=true
 */
export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json(errorResponse('Not authenticated')); return; }

    const { page, limit, offset } = getPaginationParams(req);
    const unreadOnly = req.query.unread_only === 'true';

    const { rows, count } = await getUserNotifications(userId, { page, limit, offset, unreadOnly });
    const pagination = getPaginationResult(count, page, limit);

    res.json(successResponse({ items: rows, pagination }));
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json(errorResponse('Error fetching notifications'));
  }
};

/**
 * Get unread notification count.
 * GET /api/notifications/unread-count
 */
export const unreadCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json(errorResponse('Not authenticated')); return; }

    const count = await getUnreadCount(userId);
    res.json(successResponse({ unread_count: count }));
  } catch (error: any) {
    console.error('Unread count error:', error);
    res.status(500).json(errorResponse('Error fetching unread count'));
  }
};

/**
 * Mark a single notification as read.
 * PUT /api/notifications/:id/read
 */
export const markRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json(errorResponse('Not authenticated')); return; }

    const id = parseId(req.params.id);
    if (!id) { res.status(400).json(errorResponse('Invalid notification ID')); return; }

    const ok = await markNotificationRead(id, userId);
    if (!ok) {
      res.status(404).json(errorResponse('Notification not found'));
      return;
    }
    res.json(successResponse(null, 'Notification marked as read'));
  } catch (error: any) {
    console.error('Mark read error:', error);
    res.status(500).json(errorResponse('Error marking notification'));
  }
};

/**
 * Mark all notifications as read.
 * PUT /api/notifications/read-all
 */
export const markAllRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json(errorResponse('Not authenticated')); return; }

    const count = await markAllNotificationsRead(userId);
    res.json(successResponse({ marked: count }, `${count} notifications marked as read`));
  } catch (error: any) {
    console.error('Mark all read error:', error);
    res.status(500).json(errorResponse('Error marking notifications'));
  }
};

/**
 * Delete a notification.
 * DELETE /api/notifications/:id
 */
export const removeNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json(errorResponse('Not authenticated')); return; }

    const id = parseId(req.params.id);
    if (!id) { res.status(400).json(errorResponse('Invalid notification ID')); return; }

    const ok = await deleteNotification(id, userId);
    if (!ok) {
      res.status(404).json(errorResponse('Notification not found'));
      return;
    }
    res.json(successResponse(null, 'Notification deleted'));
  } catch (error: any) {
    console.error('Delete notification error:', error);
    res.status(500).json(errorResponse('Error deleting notification'));
  }
};

// ─── Notification settings / preferences ─────────────────────────────

/**
 * Get all notification preferences for current user.
 * GET /api/notifications/settings
 */
export const getSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json(errorResponse('Not authenticated')); return; }

    const prefs = await getUserPreferences(userId);

    // Also include master toggles from User model
    const user = await (await import('../models/User')).default.findByPk(userId, {
      attributes: ['notification_in_app', 'notification_email', 'notification_push'],
    });

    res.json(successResponse({
      master: {
        in_app: user?.notification_in_app ?? true,
        email: user?.notification_email ?? true,
        push: user?.notification_push ?? true,
      },
      preferences: prefs,
      available_types: ALL_NOTIFICATION_TYPES,
    }));
  } catch (error: any) {
    console.error('Get settings error:', error);
    res.status(500).json(errorResponse('Error fetching notification settings'));
  }
};

/**
 * Update master channel toggles.
 * PUT /api/notifications/settings/master
 * Body: { notification_in_app?, notification_email?, notification_push? }
 */
export const updateMaster = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json(errorResponse('Not authenticated')); return; }

    const { notification_in_app, notification_email, notification_push } = req.body;

    await updateMasterToggles(userId, { notification_in_app, notification_email, notification_push });
    res.json(successResponse(null, 'Master notification settings updated'));
  } catch (error: any) {
    console.error('Update master settings error:', error);
    res.status(500).json(errorResponse('Error updating master settings'));
  }
};

/**
 * Update preference for a single notification type.
 * PUT /api/notifications/settings/:type
 * Body: { channel_in_app?, channel_email?, channel_push?, frequency? }
 */
export const updatePreference = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json(errorResponse('Not authenticated')); return; }

    const notificationType = req.params.type;
    if (!ALL_NOTIFICATION_TYPES.includes(notificationType as any)) {
      res.status(400).json(errorResponse(`Invalid notification type. Valid: ${ALL_NOTIFICATION_TYPES.join(', ')}`));
      return;
    }

    const { channel_in_app, channel_email, channel_push, frequency } = req.body;

    if (frequency) {
      const validFreqs = ['realtime', 'daily_digest', 'weekly_digest', 'none'];
      if (!validFreqs.includes(frequency)) {
        res.status(400).json(errorResponse(`frequency must be one of: ${validFreqs.join(', ')}`));
        return;
      }
    }

    const pref = await updateUserPreference(userId, notificationType, {
      channel_in_app, channel_email, channel_push, frequency,
    });

    res.json(successResponse(pref, 'Preference updated'));
  } catch (error: any) {
    console.error('Update preference error:', error);
    res.status(500).json(errorResponse('Error updating preference'));
  }
};

/**
 * Bulk-update preferences for multiple types at once.
 * PUT /api/notifications/settings/bulk
 * Body: { preferences: [{ notification_type, channel_in_app?, channel_email?, channel_push?, frequency? }] }
 */
export const bulkUpdate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json(errorResponse('Not authenticated')); return; }

    const { preferences } = req.body;
    if (!Array.isArray(preferences) || preferences.length === 0) {
      res.status(400).json(errorResponse('preferences array is required'));
      return;
    }

    const results = await bulkUpdatePreferences(userId, preferences);
    res.json(successResponse(results, `${results.length} preferences updated`));
  } catch (error: any) {
    console.error('Bulk update error:', error);
    res.status(500).json(errorResponse('Error bulk-updating preferences'));
  }
};

// ─── Admin: send test notification ───────────────────────────────────

/**
 * Admin: send a test notification to a user (PoC / debugging).
 * POST /api/notifications/admin/test
 * Body: { user_id, type?, title, message, game_id? }
 */
export const adminSendTest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { user_id, type, title, message, game_id } = req.body;

    if (!user_id || !title || !message) {
      res.status(400).json(errorResponse('user_id, title, and message are required'));
      return;
    }

    const validType = ALL_NOTIFICATION_TYPES.includes(type) ? type : 'update';

    const notifications = await emitNotification({
      type: validType,
      title,
      message,
      game_id,
      userIds: [user_id],
    });

    res.json(successResponse(
      { created: notifications.length, queue_depth: getQueueDepth() },
      'Test notification sent (check email / push logs)',
    ));
  } catch (error: any) {
    console.error('Admin test notification error:', error);
    res.status(500).json(errorResponse('Error sending test notification'));
  }
};
