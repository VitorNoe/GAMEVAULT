import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * Granular per-event-type notification preferences.
 * Each row controls which channels are enabled for a specific notification type,
 * plus an optional frequency cap.
 */

export type NotificationChannel = 'in_app' | 'email' | 'push';
export type NotificationFrequency = 'realtime' | 'daily_digest' | 'weekly_digest' | 'none';

export interface NotificationPreferenceAttributes {
  id: number;
  user_id: number;
  notification_type: string;       // matches NotificationType from Notification model
  channel_in_app: boolean;
  channel_email: boolean;
  channel_push: boolean;
  frequency: NotificationFrequency;
  created_at?: Date;
  updated_at?: Date;
}

interface NotificationPreferenceCreationAttributes
  extends Optional<NotificationPreferenceAttributes, 'id' | 'channel_in_app' | 'channel_email' | 'channel_push' | 'frequency' | 'created_at' | 'updated_at'> {}

class NotificationPreference
  extends Model<NotificationPreferenceAttributes, NotificationPreferenceCreationAttributes>
  implements NotificationPreferenceAttributes
{
  public id!: number;
  public user_id!: number;
  public notification_type!: string;
  public channel_in_app!: boolean;
  public channel_email!: boolean;
  public channel_push!: boolean;
  public frequency!: NotificationFrequency;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

NotificationPreference.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    notification_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    channel_in_app: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    channel_email: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    channel_push: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    frequency: {
      type: DataTypes.ENUM('realtime', 'daily_digest', 'weekly_digest', 'none'),
      allowNull: false,
      defaultValue: 'realtime',
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
    tableName: 'notification_preferences',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id', 'notification_type'], unique: true },
      { fields: ['user_id'] },
    ],
  },
);

export default NotificationPreference;
