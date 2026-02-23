import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface PublisherAttributes {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
  status: 'active' | 'closed' | 'acquired';
  acquired_by?: number;
  foundation_year?: number;
  closure_year?: number;
  website?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface PublisherCreationAttributes extends Optional<PublisherAttributes, 'id' | 'logo_url' | 'status' | 'acquired_by' | 'foundation_year' | 'closure_year' | 'website' | 'created_at' | 'updated_at'> {}

class Publisher extends Model<PublisherAttributes, PublisherCreationAttributes> implements PublisherAttributes {
  public id!: number;
  public name!: string;
  public slug!: string;
  public logo_url?: string;
  public status!: 'active' | 'closed' | 'acquired';
  public acquired_by?: number;
  public foundation_year?: number;
  public closure_year?: number;
  public website?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Publisher.init(
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
      unique: true,
    },
    logo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'closed', 'acquired'),
      allowNull: false,
      defaultValue: 'active',
    },
    acquired_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'publishers',
        key: 'id',
      },
    },
    foundation_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    closure_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(500),
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
    tableName: 'publishers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['slug'], unique: true },
      { fields: ['status'] },
    ],
  }
);

export default Publisher;
