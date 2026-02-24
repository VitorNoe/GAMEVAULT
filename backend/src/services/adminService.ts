import { Op, WhereOptions } from 'sequelize';
import User from '../models/User';
import UserActivity from '../models/UserActivity';

// ─── Helpers ─────────────────────────────────────────────────────────

const SAFE_USER_ATTRS = [
  'id', 'name', 'email', 'avatar_url', 'bio', 'type',
  'email_verified', 'is_banned', 'banned_at', 'ban_reason', 'banned_by',
  'last_login', 'created_at', 'updated_at',
];

type AdminActivityType =
  | 'admin_ban_user'
  | 'admin_unban_user'
  | 'admin_role_change'
  | 'admin_delete_user'
  | 'admin_moderation'
  | 'admin_action';

async function logAdminAction(
  adminId: number,
  activityType: AdminActivityType,
  entityType: string,
  entityId: number,
  description: string,
  metadata?: object,
): Promise<void> {
  await UserActivity.create({
    user_id: adminId,
    activity_type: activityType,
    entity_type: entityType,
    entity_id: entityId,
    description,
    metadata,
  });
}

// ─── User listing ────────────────────────────────────────────────────

export interface UserListFilters {
  search?: string;
  type?: 'regular' | 'admin';
  isBanned?: boolean;
  emailVerified?: boolean;
}

export async function listUsers(
  filters: UserListFilters,
  limit: number,
  offset: number,
): Promise<{ rows: User[]; count: number }> {
  const where: WhereOptions = {};

  if (filters.search) {
    where[Op.or as any] = [
      { name: { [Op.iLike]: `%${filters.search}%` } },
      { email: { [Op.iLike]: `%${filters.search}%` } },
    ];
  }
  if (filters.type) {
    (where as any).user_type = filters.type;
  }
  if (filters.isBanned !== undefined) {
    (where as any).is_banned = filters.isBanned;
  }
  if (filters.emailVerified !== undefined) {
    (where as any).email_verified = filters.emailVerified;
  }

  return User.findAndCountAll({
    where,
    attributes: SAFE_USER_ATTRS,
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
}

// ─── Single user detail (admin view) ─────────────────────────────────

export async function getUserDetail(userId: number): Promise<User | null> {
  return User.findByPk(userId, {
    attributes: SAFE_USER_ATTRS,
  });
}

// ─── Role change ─────────────────────────────────────────────────────

export async function changeUserRole(
  targetUserId: number,
  newRole: 'regular' | 'admin',
  adminId: number,
): Promise<User> {
  const user = await User.findByPk(targetUserId);
  if (!user) {
    const err: any = new Error('User not found');
    err.status = 404;
    throw err;
  }

  if (user.id === adminId) {
    const err: any = new Error('Cannot change your own role');
    err.status = 400;
    throw err;
  }

  const previousRole = user.type;
  user.type = newRole;
  await user.save();

  await logAdminAction(adminId, 'admin_role_change', 'user', targetUserId,
    `Changed role from ${previousRole} to ${newRole}`,
    { previous_role: previousRole, new_role: newRole },
  );

  return user;
}

// ─── Ban / Unban ─────────────────────────────────────────────────────

export async function banUser(
  targetUserId: number,
  adminId: number,
  reason?: string,
): Promise<User> {
  const user = await User.findByPk(targetUserId);
  if (!user) {
    const err: any = new Error('User not found');
    err.status = 404;
    throw err;
  }

  if (user.id === adminId) {
    const err: any = new Error('Cannot ban yourself');
    err.status = 400;
    throw err;
  }

  if (user.type === 'admin') {
    const err: any = new Error('Cannot ban another admin');
    err.status = 400;
    throw err;
  }

  if (user.is_banned) {
    const err: any = new Error('User is already banned');
    err.status = 409;
    throw err;
  }

  user.is_banned = true;
  user.banned_at = new Date();
  user.ban_reason = reason || null;
  user.banned_by = adminId;
  await user.save();

  await logAdminAction(adminId, 'admin_ban_user', 'user', targetUserId,
    `Banned user: ${user.name} (${user.email})${reason ? ` — ${reason}` : ''}`,
    { reason },
  );

  return user;
}

export async function unbanUser(
  targetUserId: number,
  adminId: number,
): Promise<User> {
  const user = await User.findByPk(targetUserId);
  if (!user) {
    const err: any = new Error('User not found');
    err.status = 404;
    throw err;
  }

  if (!user.is_banned) {
    const err: any = new Error('User is not banned');
    err.status = 409;
    throw err;
  }

  user.is_banned = false;
  user.banned_at = null;
  user.ban_reason = null;
  user.banned_by = null;
  await user.save();

  await logAdminAction(adminId, 'admin_unban_user', 'user', targetUserId,
    `Unbanned user: ${user.name} (${user.email})`,
  );

  return user;
}

// ─── Delete user (hard) ──────────────────────────────────────────────

export async function adminDeleteUser(
  targetUserId: number,
  adminId: number,
): Promise<void> {
  const user = await User.findByPk(targetUserId, { attributes: ['id', 'name', 'email', 'type'] });
  if (!user) {
    const err: any = new Error('User not found');
    err.status = 404;
    throw err;
  }

  if (user.id === adminId) {
    const err: any = new Error('Cannot delete yourself');
    err.status = 400;
    throw err;
  }

  if (user.type === 'admin') {
    const err: any = new Error('Cannot delete another admin');
    err.status = 400;
    throw err;
  }

  const userName = user.name;
  const userEmail = user.email;
  await user.destroy();

  await logAdminAction(adminId, 'admin_delete_user', 'user', targetUserId,
    `Deleted user: ${userName} (${userEmail})`,
  );
}

// ─── Activity logs ───────────────────────────────────────────────────

export interface ActivityLogFilters {
  activityType?: string;
  entityType?: string;
  userId?: number;
}

export async function getActivityLogs(
  filters: ActivityLogFilters,
  limit: number,
  offset: number,
): Promise<{ rows: UserActivity[]; count: number }> {
  const where: WhereOptions = {};

  if (filters.activityType) {
    (where as any).activity_type = filters.activityType;
  }
  if (filters.entityType) {
    (where as any).entity_type = filters.entityType;
  }
  if (filters.userId) {
    (where as any).user_id = filters.userId;
  }

  return UserActivity.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit,
    offset,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'avatar_url'],
      },
    ],
  });
}

export { logAdminAction };
