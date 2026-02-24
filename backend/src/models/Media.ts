import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * Media Asset model
 *
 * Tracks every uploaded file (images, videos, documents).
 * Each row stores the storage key, provider, metadata, and references
 * to the entity it belongs to (game, user, review, etc.).
 */

export type MediaCategory = 'cover' | 'screenshot' | 'trailer' | 'avatar' | 'document' | 'other';
export type MediaEntityType = 'game' | 'user' | 'review' | 'developer' | 'publisher' | 'platform' | 'general';

export interface MediaAttributes {
  id: number;
  storage_key: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  category: MediaCategory;
  entity_type: MediaEntityType;
  entity_id?: number;
  uploader_id: number;
  width?: number;
  height?: number;
  duration_seconds?: number;       // for video
  thumbnail_key?: string;          // storage key for default thumbnail
  thumbnails?: Record<string, string>; // { thumb: "key", medium: "key", large: "key" }
  version: number;
  is_public: boolean;
  provider: 'local' | 's3';
  created_at?: Date;
  updated_at?: Date;
}

interface MediaCreationAttributes extends Optional<MediaAttributes,
  'id' | 'entity_id' | 'width' | 'height' | 'duration_seconds' |
  'thumbnail_key' | 'thumbnails' | 'version' | 'is_public' | 'provider' |
  'created_at' | 'updated_at'
> {}

class Media extends Model<MediaAttributes, MediaCreationAttributes> implements MediaAttributes {
  public id!: number;
  public storage_key!: string;
  public original_filename!: string;
  public mime_type!: string;
  public file_size!: number;
  public category!: MediaCategory;
  public entity_type!: MediaEntityType;
  public entity_id?: number;
  public uploader_id!: number;
  public width?: number;
  public height?: number;
  public duration_seconds?: number;
  public thumbnail_key?: string;
  public thumbnails?: Record<string, string>;
  public version!: number;
  public is_public!: boolean;
  public provider!: 'local' | 's3';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Media.init(
  {
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
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'media',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['storage_key'], unique: true },
      { fields: ['entity_type', 'entity_id'] },
      { fields: ['uploader_id'] },
      { fields: ['category'] },
      { fields: ['created_at'] },
    ],
  },
);

export default Media;
