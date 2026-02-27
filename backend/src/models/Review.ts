import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ReviewAttributes {
  id: number;
  user_id: number;
  game_id: number;
  platform_id?: number;
  rating: number;
  review_text?: string;
  has_spoilers: boolean;
  hours_played?: number;
  recommends?: boolean;
  likes_count: number;
  dislikes_count: number;
  moderation_status: 'approved' | 'flagged' | 'removed' | 'pending';
  moderation_reason?: string;
  moderated_by?: number;
  moderated_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface ReviewCreationAttributes extends Optional<ReviewAttributes, 'id' | 'platform_id' | 'review_text' | 'has_spoilers' | 'hours_played' | 'recommends' | 'likes_count' | 'dislikes_count' | 'moderation_status' | 'moderation_reason' | 'moderated_by' | 'moderated_at' | 'created_at' | 'updated_at'> {}

class Review extends Model<ReviewAttributes, ReviewCreationAttributes> implements ReviewAttributes {
  public id!: number;
  public user_id!: number;
  public game_id!: number;
  public platform_id?: number;
  public rating!: number;
  public review_text?: string;
  public has_spoilers!: boolean;
  public hours_played?: number;
  public recommends?: boolean;
  public likes_count!: number;
  public dislikes_count!: number;
  public moderation_status!: 'approved' | 'flagged' | 'removed' | 'pending';
  public moderation_reason?: string;
  public moderated_by?: number;
  public moderated_at?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Review.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'games',
        key: 'id',
      },
    },
    platform_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'platforms',
        key: 'id',
      },
    },
    rating: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 10,
      },
    },
    review_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    has_spoilers: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    hours_played: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    recommends: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    likes_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    dislikes_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    moderation_status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'approved',
    },
    moderation_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    moderated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    moderated_at: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'reviews',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['game_id'] },
      { fields: ['rating'] },
      { fields: ['likes_count'] },
      { fields: ['user_id', 'game_id'], unique: true },
    ],
  }
);

export default Review;
