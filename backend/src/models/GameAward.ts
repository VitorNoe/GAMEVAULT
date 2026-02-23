import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface GameAwardAttributes {
  game_id: number;
  award_id: number;
}

class GameAward extends Model<GameAwardAttributes> implements GameAwardAttributes {
  public game_id!: number;
  public award_id!: number;
}

GameAward.init(
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
    award_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'awards',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'games_awards',
    timestamps: false,
    indexes: [
      { fields: ['game_id'] },
      { fields: ['award_id'] },
    ],
  }
);

export default GameAward;
