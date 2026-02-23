import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface GameGenreAttributes {
  game_id: number;
  genre_id: number;
}

class GameGenre extends Model<GameGenreAttributes> implements GameGenreAttributes {
  public game_id!: number;
  public genre_id!: number;
}

GameGenre.init(
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
    genre_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'genres',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'games_genres',
    timestamps: false,
    indexes: [
      { fields: ['game_id'] },
      { fields: ['genre_id'] },
    ],
  }
);

export default GameGenre;
