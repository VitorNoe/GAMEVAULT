/**
 * Notification Service
 *
 * Central service for generating, storing and dispatching notifications
 * across all channels (in-app, email, push) respecting user preferences.
 *
 * Flow:
 *  1. An event occurs (game released, wishlist item available, etc.)
 *  2. `emitNotification()` is called with event details + target user(s)
 *  3. User preferences are checked per-channel
 *  4. Notification is stored in DB (in-app)
 *  5. Email / push are dispatched via the notification queue
 */

import Notification, { NotificationType } from '../models/Notification';
import NotificationPreference from '../models/NotificationPreference';
import User from '../models/User';
import Game from '../models/Game';
import { Op } from 'sequelize';
import { sendNotificationEmail } from './emailService';
import { sendPushToDevice, PushPayload } from './pushService';
import { enqueueNotificationJob, NotificationJob } from './notificationQueue';

// ─── Types ───────────────────────────────────────────────────────────

export interface NotificationEvent {
  type: NotificationType;
  title: string;
  message: string;
  game_id?: number;
  /** Target user IDs. If omitted, caller must specify users. */
  userIds: number[];
}

// All known notification types — used to seed default preferences
export const ALL_NOTIFICATION_TYPES: NotificationType[] = [
  'release',
  'rerelease',
  'update',
  'goty',
  'review_like',
  'status_change',
  'milestone',
];

// ─── Preference helpers ──────────────────────────────────────────────

/**
 * Get effective preference for a user + notification type.
 * Falls back to the global toggles on the User model if no row exists.
 */
async function getEffectivePreference(
  userId: number,
  notificationType: NotificationType,
): Promise<{ inApp: boolean; email: boolean; push: boolean; frequency: string }> {
  const pref = await NotificationPreference.findOne({
    where: { user_id: userId, notification_type: notificationType },
  });

  if (pref) {
    return {
      inApp: pref.channel_in_app,
      email: pref.channel_email,
      push: pref.channel_push,
      frequency: pref.frequency,
    };
  }

  // Fall back to the master toggles on User
  const user = await User.findByPk(userId, {
    attributes: ['notification_in_app', 'notification_email', 'notification_push'],
  });

  return {
    inApp: user?.notification_in_app ?? true,
    email: user?.notification_email ?? true,
    push: user?.notification_push ?? true,
    frequency: 'realtime',
  };
}

/**
 * Seed default preferences for a user (all types, all channels enabled).
 */
export async function seedDefaultPreferences(userId: number): Promise<void> {
  const existing = await NotificationPreference.findAll({
    where: { user_id: userId },
    attributes: ['notification_type'],
  });

  const existingTypes = new Set(existing.map((p) => p.notification_type));
  const missing = ALL_NOTIFICATION_TYPES.filter((t) => !existingTypes.has(t));

  if (missing.length > 0) {
    await NotificationPreference.bulkCreate(
      missing.map((nType) => ({
        user_id: userId,
        notification_type: nType,
      })),
      { ignoreDuplicates: true },
    );
  }
}

// ─── CRUD helpers (for settings endpoints) ───────────────────────────

export async function getUserPreferences(userId: number) {
  // Ensure defaults exist
  await seedDefaultPreferences(userId);
  return NotificationPreference.findAll({
    where: { user_id: userId },
    order: [['notification_type', 'ASC']],
  });
}

export async function updateUserPreference(
  userId: number,
  notificationType: string,
  data: Partial<{
    channel_in_app: boolean;
    channel_email: boolean;
    channel_push: boolean;
    frequency: string;
  }>,
): Promise<NotificationPreference | null> {
  const [pref] = await NotificationPreference.findOrCreate({
    where: { user_id: userId, notification_type: notificationType },
    defaults: { user_id: userId, notification_type: notificationType },
  });

  if (data.channel_in_app !== undefined) pref.channel_in_app = data.channel_in_app;
  if (data.channel_email !== undefined) pref.channel_email = data.channel_email;
  if (data.channel_push !== undefined) pref.channel_push = data.channel_push;
  if (data.frequency !== undefined) pref.frequency = data.frequency as any;
  await pref.save();
  return pref;
}

export async function bulkUpdatePreferences(
  userId: number,
  updates: Array<{
    notification_type: string;
    channel_in_app?: boolean;
    channel_email?: boolean;
    channel_push?: boolean;
    frequency?: string;
  }>,
): Promise<NotificationPreference[]> {
  const results: NotificationPreference[] = [];
  for (const u of updates) {
    const pref = await updateUserPreference(userId, u.notification_type, u);
    if (pref) results.push(pref);
  }
  return results;
}

/**
 * Update the master channel toggles on the User model.
 */
export async function updateMasterToggles(
  userId: number,
  data: Partial<{
    notification_in_app: boolean;
    notification_email: boolean;
    notification_push: boolean;
  }>,
): Promise<void> {
  const updateFields: Record<string, boolean> = {};
  if (data.notification_in_app !== undefined) updateFields.notification_in_app = data.notification_in_app;
  if (data.notification_email !== undefined) updateFields.notification_email = data.notification_email;
  if (data.notification_push !== undefined) updateFields.notification_push = data.notification_push;

  if (Object.keys(updateFields).length > 0) {
    await User.update(updateFields as any, { where: { id: userId } });
  }
}

// ─── Core: emit notification ─────────────────────────────────────────

/**
 * Emit a notification event to one or more users.
 *
 * For each target user:
 *  - Checks their channel preferences
 *  - Always creates an in-app record (if channel enabled)
 *  - Enqueues email / push jobs via the background worker
 */
export async function emitNotification(event: NotificationEvent): Promise<Notification[]> {
  const created: Notification[] = [];

  for (const userId of event.userIds) {
    const pref = await getEffectivePreference(userId, event.type);

    // Skip entirely if frequency is 'none'
    if (pref.frequency === 'none') continue;

    // 1. In-app notification (stored in DB)
    if (pref.inApp) {
      const notif = await Notification.create({
        user_id: userId,
        notification_type: event.type,
        game_id: event.game_id,
        title: event.title,
        message: event.message,
      });
      created.push(notif);
    }

    // 2. Email (enqueue for background processing)
    if (pref.email && pref.frequency === 'realtime') {
      const job: NotificationJob = {
        channel: 'email',
        userId,
        payload: {
          type: event.type,
          title: event.title,
          message: event.message,
          gameId: event.game_id,
        },
      };
      enqueueNotificationJob(job);
    }

    // 3. Push (enqueue for background processing)
    if (pref.push && pref.frequency === 'realtime') {
      const job: NotificationJob = {
        channel: 'push',
        userId,
        payload: {
          type: event.type,
          title: event.title,
          message: event.message,
          gameId: event.game_id,
        },
      };
      enqueueNotificationJob(job);
    }
  }

  return created;
}

// ─── In-app notification queries ─────────────────────────────────────

export async function getUserNotifications(
  userId: number,
  opts: { page: number; limit: number; offset: number; unreadOnly?: boolean },
) {
  const where: Record<string, unknown> = { user_id: userId };
  if (opts.unreadOnly) where.is_read = false;

  return Notification.findAndCountAll({
    where,
    include: [
      { model: Game, as: 'game', attributes: ['id', 'title', 'slug', 'cover_url'], required: false },
    ],
    order: [['created_at', 'DESC']],
    limit: opts.limit,
    offset: opts.offset,
    distinct: true,
  });
}

export async function markNotificationRead(notificationId: number, userId: number): Promise<boolean> {
  const [count] = await Notification.update(
    { is_read: true },
    { where: { id: notificationId, user_id: userId } },
  );
  return count > 0;
}

export async function markAllNotificationsRead(userId: number): Promise<number> {
  const [count] = await Notification.update(
    { is_read: true },
    { where: { user_id: userId, is_read: false } },
  );
  return count;
}

export async function deleteNotification(notificationId: number, userId: number): Promise<boolean> {
  const count = await Notification.destroy({
    where: { id: notificationId, user_id: userId },
  });
  return count > 0;
}

export async function getUnreadCount(userId: number): Promise<number> {
  return Notification.count({ where: { user_id: userId, is_read: false } });
}
