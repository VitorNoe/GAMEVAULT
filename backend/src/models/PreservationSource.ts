import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface PreservationSourceAttributes {
  id: number;
  name: string;
  slug: string;
  url: string;
  source_type: 'museum' | 'archive' | 'organization';
  logo_url?: string;
  description?: string;
  created_at?: Date;
}

interface PreservationSourceCreationAttributes extends Optional<PreservationSourceAttributes, 'id' | 'logo_url' | 'description' | 'created_at'> {}

class PreservationSource extends Model<PreservationSourceAttributes, PreservationSourceCreationAttributes> implements PreservationSourceAttributes {
  public id!: number;
  public name!: string;
  public slug!: string;
  public url!: string;
  public source_type!: 'museum' | 'archive' | 'organization';
  public logo_url?: string;
  public description?: string;
  public readonly created_at!: Date;
}

PreservationSource.init(
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
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    source_type: {
      type: DataTypes.ENUM('museum', 'archive', 'organization'),
      allowNull: false,
    },
    logo_url: {
      type: DataTypes.STRING(500),
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
    tableName: 'preservation_sources',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['slug'], unique: true },
    ],
  }
);

export default PreservationSource;
