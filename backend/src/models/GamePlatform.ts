import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface GamePlatformAttributes {
  game_id: number;
  platform_id: number;
  platform_release_date?: Date;
  exclusivity: 'permanent' | 'temporary' | 'none';
  created_at?: Date;
}

class GamePlatform extends Model<GamePlatformAttributes> implements GamePlatformAttributes {
  public game_id!: number;
  public platform_id!: number;
  public platform_release_date?: Date;
  public exclusivity!: 'permanent' | 'temporary' | 'none';
  public readonly created_at!: Date;
}

GamePlatform.init(
  {
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'games',
        key: 'id',
      },
    },
    platform_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'platforms',
        key: 'id',
      },
    },
    platform_release_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    exclusivity: {
      type: DataTypes.ENUM('permanent', 'temporary', 'none'),
      allowNull: false,
      defaultValue: 'none',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'games_platforms',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['game_id'] },
      { fields: ['platform_id'] },
      { fields: ['exclusivity'] },
    ],
  }
);

export default GamePlatform;
