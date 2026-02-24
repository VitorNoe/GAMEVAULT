import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Abandonware & Preservation module
 *
 * This migration is a safety-net for environments where the schema.sql
 * tables already exist. Every operation is idempotent.
 */

async function tableExists(qi: QueryInterface, table: string): Promise<boolean> {
  try {
    await qi.describeTable(table);
    return true;
  } catch {
    return false;
  }
}

async function safeCreateTable(qi: QueryInterface, table: string, columns: Record<string, any>, options?: any): Promise<void> {
  if (await tableExists(qi, table)) {
    console.log(`  ✓ Table "${table}" already exists, skipping`);
    return;
  }
  await qi.createTable(table, columns, options);
  console.log(`  ✓ Created table "${table}"`);
}

async function safeAddIndex(qi: QueryInterface, table: string, fields: string[], options?: any): Promise<void> {
  try {
    await qi.addIndex(table, fields, options);
  } catch {
    // index already exists
  }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  console.log('\n=== Migration 005: Abandonware & Preservation module ===\n');

  // ── preservation_sources ───────────────────────────────────────────
  await safeCreateTable(queryInterface, 'preservation_sources', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
    url: { type: DataTypes.STRING(500), allowNull: false },
    source_type: { type: DataTypes.ENUM('museum', 'archive', 'organization'), allowNull: false },
    logo_url: { type: DataTypes.STRING(500), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await safeAddIndex(queryInterface, 'preservation_sources', ['slug'], { unique: true });

  // ── games_preservation (junction) ──────────────────────────────────
  await safeCreateTable(queryInterface, 'games_preservation', {
    game_id: {
      type: DataTypes.INTEGER, allowNull: false, primaryKey: true,
      references: { model: 'games', key: 'id' }, onDelete: 'CASCADE',
    },
    source_id: {
      type: DataTypes.INTEGER, allowNull: false, primaryKey: true,
      references: { model: 'preservation_sources', key: 'id' }, onDelete: 'CASCADE',
    },
    available: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    specific_url: { type: DataTypes.STRING(500), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await safeAddIndex(queryInterface, 'games_preservation', ['game_id']);
  await safeAddIndex(queryInterface, 'games_preservation', ['source_id']);

  // ── rerelease_requests ─────────────────────────────────────────────
  await safeCreateTable(queryInterface, 'rerelease_requests', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    game_id: {
      type: DataTypes.INTEGER, allowNull: false, unique: true,
      references: { model: 'games', key: 'id' }, onDelete: 'CASCADE',
    },
    total_votes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.ENUM('active', 'fulfilled', 'archived'), allowNull: false, defaultValue: 'active' },
    fulfilled_date: { type: DataTypes.DATEONLY, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await safeAddIndex(queryInterface, 'rerelease_requests', ['game_id'], { unique: true });
  await safeAddIndex(queryInterface, 'rerelease_requests', ['total_votes']);
  await safeAddIndex(queryInterface, 'rerelease_requests', ['status']);

  // ── rerelease_votes ────────────────────────────────────────────────
  await safeCreateTable(queryInterface, 'rerelease_votes', {
    request_id: {
      type: DataTypes.INTEGER, allowNull: false, primaryKey: true,
      references: { model: 'rerelease_requests', key: 'id' }, onDelete: 'CASCADE',
    },
    user_id: {
      type: DataTypes.INTEGER, allowNull: false, primaryKey: true,
      references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
    },
    comment: { type: DataTypes.TEXT, allowNull: true },
    vote_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await safeAddIndex(queryInterface, 'rerelease_votes', ['request_id']);
  await safeAddIndex(queryInterface, 'rerelease_votes', ['user_id']);

  console.log('\n=== Migration 005 complete ===\n');
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  console.log('\n=== Reverting Migration 005 ===\n');

  await queryInterface.dropTable('rerelease_votes').catch(() => {});
  await queryInterface.dropTable('rerelease_requests').catch(() => {});
  await queryInterface.dropTable('games_preservation').catch(() => {});
  await queryInterface.dropTable('preservation_sources').catch(() => {});

  console.log('\n=== Migration 005 reverted ===\n');
}
