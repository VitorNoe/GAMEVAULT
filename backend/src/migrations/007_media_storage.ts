import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration 007: Create `media` table for image and media storage.
 *
 * Stores metadata for every uploaded file: images, videos, documents.
 * Each row tracks its storage key, provider (local / S3), category,
 * linked entity, thumbnails, and versioning info.
 */

// ── Helpers for idempotent migrations ────────────────────────────────

async function tableExists(qi: QueryInterface, tableName: string): Promise<boolean> {
  const tables = await qi.showAllTables();
  return tables.includes(tableName);
}

async function safeCreateEnum(
  qi: QueryInterface,
  name: string,
  values: string[],
): Promise<void> {
  const seq = qi.sequelize;
  const valuesList = values.map((v) => `'${v}'`).join(', ');
  await seq.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${name}') THEN CREATE TYPE "enum_media_${name}" AS ENUM (${valuesList}); END IF; END $$;`);
}

// ── UP ───────────────────────────────────────────────────────────────

export async function up(queryInterface: QueryInterface): Promise<void> {
  const qi = queryInterface;

  if (await tableExists(qi, 'media')) {
    console.log('  ✔ media table already exists – skipping');
    return;
  }

  await qi.createTable('media', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    storage_key: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    original_filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('cover', 'screenshot', 'trailer', 'avatar', 'document', 'other'),
      allowNull: false,
      defaultValue: 'other',
    },
    entity_type: {
      type: DataTypes.ENUM('game', 'user', 'review', 'developer', 'publisher', 'platform', 'general'),
      allowNull: false,
      defaultValue: 'general',
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    uploader_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    duration_seconds: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    thumbnail_key: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    thumbnails: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    provider: {
      type: DataTypes.ENUM('local', 's3'),
      allowNull: false,
      defaultValue: 'local',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Performance indexes
  await qi.addIndex('media', ['storage_key'], { unique: true, name: 'idx_media_storage_key' });
  await qi.addIndex('media', ['entity_type', 'entity_id'], { name: 'idx_media_entity' });
  await qi.addIndex('media', ['uploader_id'], { name: 'idx_media_uploader' });
  await qi.addIndex('media', ['category'], { name: 'idx_media_category' });
  await qi.addIndex('media', ['created_at'], { name: 'idx_media_created' });

  console.log('  ✔ Created media table with indexes');
}

// ── DOWN ─────────────────────────────────────────────────────────────

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('media');

  // Clean up ENUMs (PostgreSQL)
  const seq = queryInterface.sequelize;
  await seq.query('DROP TYPE IF EXISTS "enum_media_category" CASCADE;');
  await seq.query('DROP TYPE IF EXISTS "enum_media_entity_type" CASCADE;');
  await seq.query('DROP TYPE IF EXISTS "enum_media_provider" CASCADE;');

  console.log('  ✔ Dropped media table and ENUMs');
}
