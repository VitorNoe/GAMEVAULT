import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type ReleaseStatus = 'released' | 'early_access' | 'open_beta' | 'closed_beta' | 'alpha' | 'coming_soon' | 'in_development' | 'cancelled';
export type AvailabilityStatus = 'available' | 'out_of_catalog' | 'expired_license' | 'abandonware' | 'public_domain' | 'discontinued' | 'rereleased';

export interface GameStatusHistoryAttributes {
  id: number;
  game_id: number;
  changed_by?: number;
  previous_release_status?: ReleaseStatus;
  new_release_status?: ReleaseStatus;
  previous_availability_status?: AvailabilityStatus;
  new_availability_status?: AvailabilityStatus;
  change_reason?: string;
  changed_at?: Date;
}

interface GameStatusHistoryCreationAttributes extends Optional<GameStatusHistoryAttributes, 'id' | 'changed_by' | 'previous_release_status' | 'new_release_status' | 'previous_availability_status' | 'new_availability_status' | 'change_reason' | 'changed_at'> {}

class GameStatusHistory extends Model<GameStatusHistoryAttributes, GameStatusHistoryCreationAttributes> implements GameStatusHistoryAttributes {
  public id!: number;
  public game_id!: number;
  public changed_by?: number;
  public previous_release_status?: ReleaseStatus;
  public new_release_status?: ReleaseStatus;
  public previous_availability_status?: AvailabilityStatus;
  public new_availability_status?: AvailabilityStatus;
  public change_reason?: string;
  public readonly changed_at!: Date;
}

GameStatusHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'games',
        key: 'id',
      },
    },
    changed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    previous_release_status: {
      type: DataTypes.ENUM('released', 'early_access', 'open_beta', 'closed_beta', 'alpha', 'coming_soon', 'in_development', 'cancelled'),
      allowNull: true,
    },
    new_release_status: {
      type: DataTypes.ENUM('released', 'early_access', 'open_beta', 'closed_beta', 'alpha', 'coming_soon', 'in_development', 'cancelled'),
      allowNull: true,
    },
    previous_availability_status: {
      type: DataTypes.ENUM('available', 'out_of_catalog', 'expired_license', 'abandonware', 'public_domain', 'discontinued', 'rereleased'),
      allowNull: true,
    },
    new_availability_status: {
      type: DataTypes.ENUM('available', 'out_of_catalog', 'expired_license', 'abandonware', 'public_domain', 'discontinued', 'rereleased'),
      allowNull: true,
    },
    change_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    changed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'game_status_history',
    timestamps: false,
    indexes: [
      { fields: ['game_id'] },
      { fields: ['changed_at'] },
      { fields: ['changed_by'] },
    ],
  }
);

export default GameStatusHistory;
