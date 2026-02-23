import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface GenreAttributes {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  created_at?: Date;
}

interface GenreCreationAttributes extends Optional<GenreAttributes, 'id' | 'icon' | 'description' | 'created_at'> {}

class Genre extends Model<GenreAttributes, GenreCreationAttributes> implements GenreAttributes {
  public id!: number;
  public name!: string;
  public slug!: string;
  public icon?: string;
  public description?: string;
  public readonly created_at!: Date;
}

Genre.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    description: {
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
    tableName: 'genres',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['slug'], unique: true },
    ],
  }
);

export default Genre;
