import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Platform attributes interface
export interface PlatformAttributes {
  id: number;
  name: string;
  slug: string;
  manufacturer?: string;
  type: 'console' | 'handheld' | 'pc' | 'mobile';
  generation?: number;
  release_year?: number;
  discontinuation_year?: number;
  logo_url?: string;
  primary_color?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface PlatformCreationAttributes extends Optional<PlatformAttributes, 'id' | 'manufacturer' | 'generation' | 'release_year' | 'discontinuation_year' | 'logo_url' | 'primary_color' | 'created_at' | 'updated_at'> {}

class Platform extends Model<PlatformAttributes, PlatformCreationAttributes> implements PlatformAttributes {
  public id!: number;
  public name!: string;
  public slug!: string;
  public manufacturer?: string;
  public type!: 'console' | 'handheld' | 'pc' | 'mobile';
  public generation?: number;
  public release_year?: number;
  public discontinuation_year?: number;
  public logo_url?: string;
  public primary_color?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Platform.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    manufacturer: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('console', 'handheld', 'pc', 'mobile'),
      allowNull: false,
      field: 'platform_type'
    },
    generation: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    release_year: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    discontinuation_year: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    logo_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    primary_color: {
      type: DataTypes.STRING(7),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'platforms',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Platform;
