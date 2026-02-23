import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type NotificationType = 'release' | 'rerelease' | 'update' | 'goty' | 'review_like' | 'status_change' | 'milestone';

export interface NotificationAttributes {
  id: number;
  user_id: number;
  notification_type: NotificationType;
  game_id?: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at?: Date;
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'game_id' | 'is_read' | 'created_at'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: number;
  public user_id!: number;
  public notification_type!: NotificationType;
  public game_id?: number;
  public title!: string;
  public message!: string;
  public is_read!: boolean;
  public readonly created_at!: Date;
}

Notification.init(
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
    notification_type: {
      type: DataTypes.ENUM('release', 'rerelease', 'update', 'goty', 'review_like', 'status_change', 'milestone'),
      allowNull: false,
    },
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'games',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['notification_type'] },
      { fields: ['is_read'] },
      { fields: ['created_at'] },
    ],
  }
);

export default Notification;
