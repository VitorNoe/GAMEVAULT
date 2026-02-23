import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface RereleaseVoteAttributes {
  request_id: number;
  user_id: number;
  comment?: string;
  vote_date?: Date;
}

class RereleaseVote extends Model<RereleaseVoteAttributes> implements RereleaseVoteAttributes {
  public request_id!: number;
  public user_id!: number;
  public comment?: string;
  public readonly vote_date!: Date;
}

RereleaseVote.init(
  {
    request_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'rerelease_requests',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    vote_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'rerelease_votes',
    timestamps: false,
    indexes: [
      { fields: ['request_id'] },
      { fields: ['user_id'] },
    ],
  }
);

export default RereleaseVote;
