import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration 008: Admin dashboard & moderation support.
 *
 * 1. Adds ban-related columns to `users` table.
 * 2. Adds moderation columns to `reviews` table.
 */

async function columnExists(qi: QueryInterface, table: string, column: string): Promise<boolean> {
  const desc = await qi.describeTable(table);
  return column in desc;
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const qi = queryInterface;

  // ── Users: ban fields ──────────────────────────────────────────────

  if (!(await columnExists(qi, 'users', 'is_banned'))) {
    await qi.addColumn('users', 'is_banned', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  }

  if (!(await columnExists(qi, 'users', 'banned_at'))) {
    await qi.addColumn('users', 'banned_at', {
      type: DataTypes.DATE,
      allowNull: true,
    });
  }

  if (!(await columnExists(qi, 'users', 'ban_reason'))) {
    await qi.addColumn('users', 'ban_reason', {
      type: DataTypes.TEXT,
      allowNull: true,
    });
  }

  if (!(await columnExists(qi, 'users', 'banned_by'))) {
    await qi.addColumn('users', 'banned_by', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  }

  // ── Reviews: moderation fields ─────────────────────────────────────

  if (!(await columnExists(qi, 'reviews', 'moderation_status'))) {
    await qi.addColumn('reviews', 'moderation_status', {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'approved',
    });
  }

  if (!(await columnExists(qi, 'reviews', 'moderation_reason'))) {
    await qi.addColumn('reviews', 'moderation_reason', {
      type: DataTypes.TEXT,
      allowNull: true,
    });
  }

  if (!(await columnExists(qi, 'reviews', 'moderated_by'))) {
    await qi.addColumn('reviews', 'moderated_by', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  }

  if (!(await columnExists(qi, 'reviews', 'moderated_at'))) {
    await qi.addColumn('reviews', 'moderated_at', {
      type: DataTypes.DATE,
      allowNull: true,
    });
  }

  // Indexes
  await qi.addIndex('users', ['is_banned'], { name: 'idx_users_is_banned' }).catch(() => {});
  await qi.addIndex('reviews', ['moderation_status'], { name: 'idx_reviews_moderation_status' }).catch(() => {});

  console.log('  ✔ Added ban columns to users, moderation columns to reviews');
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const qi = queryInterface;

  // Reviews
  await qi.removeIndex('reviews', 'idx_reviews_moderation_status').catch(() => {});
  await qi.removeColumn('reviews', 'moderated_at').catch(() => {});
  await qi.removeColumn('reviews', 'moderated_by').catch(() => {});
  await qi.removeColumn('reviews', 'moderation_reason').catch(() => {});
  await qi.removeColumn('reviews', 'moderation_status').catch(() => {});

  // Users
  await qi.removeIndex('users', 'idx_users_is_banned').catch(() => {});
  await qi.removeColumn('users', 'banned_by').catch(() => {});
  await qi.removeColumn('users', 'ban_reason').catch(() => {});
  await qi.removeColumn('users', 'banned_at').catch(() => {});
  await qi.removeColumn('users', 'is_banned').catch(() => {});

  console.log('  ✔ Removed ban & moderation columns');
}
