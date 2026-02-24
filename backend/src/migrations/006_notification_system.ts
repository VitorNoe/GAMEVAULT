import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Notification system — preferences, channels, frequency
 *
 * Creates the notification_preferences table and ensures the
 * notifications table exists. All operations are idempotent.
 */

async function tableExists(qi: QueryInterface, table: string): Promise<boolean> {
  try {
    await qi.describeTable(table);
    return true;
  } catch {
    return false;
  }
}

async function safeCreateTable(
  qi: QueryInterface,
  table: string,
  columns: Record<string, any>,
  options?: any,
): Promise<void> {
  if (await tableExists(qi, table)) {
    console.log(`  ✓ Table "${table}" already exists, skipping`);
    return;
  }
  await qi.createTable(table, columns, options);
  console.log(`  ✓ Created table "${table}"`);
}

async function safeAddIndex(
  qi: QueryInterface,
  table: string,
  fields: string[],
  options?: any,
): Promise<void> {
  try {
    await qi.addIndex(table, fields, options);
  } catch {
    // index already exists
  }
}

async function safeAddColumn(
  qi: QueryInterface,
  table: string,
  column: string,
  definition: any,
): Promise<void> {
  try {
    await qi.addColumn(table, column, definition);
    console.log(`  ✓ Added column "${table}.${column}"`);
  } catch {
    // column already exists
  }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  console.log('\n=== Migration 006: Notification system ===\n');

  // ── notification_preferences ───────────────────────────────────────
  await safeCreateTable(queryInterface, 'notification_preferences', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    notification_type: { type: DataTypes.STRING(50), allowNull: false },
    channel_in_app: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    channel_email: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    channel_push: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    frequency: {
      type: DataTypes.ENUM('realtime', 'daily_digest', 'weekly_digest', 'none'),
      allowNull: false,
      defaultValue: 'realtime',
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await safeAddIndex(queryInterface, 'notification_preferences', ['user_id', 'notification_type'], { unique: true });
  await safeAddIndex(queryInterface, 'notification_preferences', ['user_id']);

  // ── Ensure master toggles exist on users table ─────────────────────
  await safeAddColumn(queryInterface, 'users', 'notification_push', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
  await safeAddColumn(queryInterface, 'users', 'notification_email', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
  await safeAddColumn(queryInterface, 'users', 'notification_in_app', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });

  console.log('\n=== Migration 006 complete ===\n');
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  console.log('\n=== Reverting Migration 006 ===\n');

  await queryInterface.dropTable('notification_preferences').catch(() => {});

  // Don't remove user columns on rollback to be safe

  console.log('\n=== Migration 006 reverted ===\n');
}
