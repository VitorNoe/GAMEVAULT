import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface UserActivityAttributes {
  id: number;
  user_id: number;
  activity_type: string;
  entity_type?: string;
  entity_id?: number;
  description?: string;
  metadata?: object;
  created_at?: Date;
}

interface UserActivityCreationAttributes extends Optional<UserActivityAttributes, 'id' | 'entity_type' | 'entity_id' | 'description' | 'metadata' | 'created_at'> {}

class UserActivity extends Model<UserActivityAttributes, UserActivityCreationAttributes> implements UserActivityAttributes {
  public id!: number;
  public user_id!: number;
  public activity_type!: string;
  public entity_type?: string;
  public entity_id?: number;
  public description?: string;
  public metadata?: object;
  public readonly created_at!: Date;
}

UserActivity.init(
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
    activity_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'user_activity',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['activity_type'] },
      { fields: ['created_at'] },
    ],
  }
);

export default UserActivity;
