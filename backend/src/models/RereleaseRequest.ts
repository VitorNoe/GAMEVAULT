import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface RereleaseRequestAttributes {
  id: number;
  game_id: number;
  total_votes: number;
  status: 'active' | 'fulfilled' | 'archived';
  fulfilled_date?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface RereleaseRequestCreationAttributes extends Optional<RereleaseRequestAttributes, 'id' | 'total_votes' | 'status' | 'fulfilled_date' | 'created_at' | 'updated_at'> {}

class RereleaseRequest extends Model<RereleaseRequestAttributes, RereleaseRequestCreationAttributes> implements RereleaseRequestAttributes {
  public id!: number;
  public game_id!: number;
  public total_votes!: number;
  public status!: 'active' | 'fulfilled' | 'archived';
  public fulfilled_date?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

RereleaseRequest.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'games',
        key: 'id',
      },
    },
    total_votes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('active', 'fulfilled', 'archived'),
      allowNull: false,
      defaultValue: 'active',
    },
    fulfilled_date: {
      type: DataTypes.DATEONLY,
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
    tableName: 'rerelease_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['game_id'], unique: true },
      { fields: ['total_votes'] },
      { fields: ['status'] },
    ],
  }
);

export default RereleaseRequest;
