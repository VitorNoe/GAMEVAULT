import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface AwardAttributes {
  id: number;
  name: string;
  slug: string;
  year: number;
  category: string;
  relevance?: number;
  website?: string;
  created_at?: Date;
}

interface AwardCreationAttributes extends Optional<AwardAttributes, 'id' | 'relevance' | 'website' | 'created_at'> {}

class Award extends Model<AwardAttributes, AwardCreationAttributes> implements AwardAttributes {
  public id!: number;
  public name!: string;
  public slug!: string;
  public year!: number;
  public category!: string;
  public relevance?: number;
  public website?: string;
  public readonly created_at!: Date;
}

Award.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    relevance: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10,
      },
    },
    website: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'awards',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['slug'] },
      { fields: ['year'] },
      { fields: ['category'] },
      { fields: ['slug', 'year', 'category'], unique: true },
    ],
  }
);

export default Award;
