import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface GamePreservationAttributes {
  game_id: number;
  source_id: number;
  available: boolean;
  specific_url?: string;
  notes?: string;
  created_at?: Date;
}

class GamePreservation extends Model<GamePreservationAttributes> implements GamePreservationAttributes {
  public game_id!: number;
  public source_id!: number;
  public available!: boolean;
  public specific_url?: string;
  public notes?: string;
  public readonly created_at!: Date;
}

GamePreservation.init(
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
    source_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'preservation_sources',
        key: 'id',
      },
    },
    available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    specific_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'games_preservation',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['game_id'] },
      { fields: ['source_id'] },
    ],
  }
);

export default GamePreservation;
