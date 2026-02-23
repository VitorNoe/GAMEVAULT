import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface WishlistAttributes {
  id: number;
  user_id: number;
  game_id: number;
  platform_id?: number;
  priority: 'high' | 'medium' | 'low';
  max_price?: number;
  notes?: string;
  created_at?: Date;
}

interface WishlistCreationAttributes extends Optional<WishlistAttributes, 'id' | 'platform_id' | 'priority' | 'max_price' | 'notes' | 'created_at'> {}

class Wishlist extends Model<WishlistAttributes, WishlistCreationAttributes> implements WishlistAttributes {
  public id!: number;
  public user_id!: number;
  public game_id!: number;
  public platform_id?: number;
  public priority!: 'high' | 'medium' | 'low';
  public max_price?: number;
  public notes?: string;
  public readonly created_at!: Date;
}

Wishlist.init(
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
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'games',
        key: 'id',
      },
    },
    platform_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'platforms',
        key: 'id',
      },
    },
    priority: {
      type: DataTypes.ENUM('high', 'medium', 'low'),
      allowNull: false,
      defaultValue: 'medium',
    },
    max_price: {
      type: DataTypes.DECIMAL(10, 2),
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
    tableName: 'wishlist',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['game_id'] },
      { fields: ['priority'] },
      { fields: ['user_id', 'game_id'], unique: true },
    ],
  }
);

export default Wishlist;
