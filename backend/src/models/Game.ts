import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Game attributes interface
export interface GameAttributes {
  id: number;
  title: string;
  slug: string;
  description?: string;
  synopsis?: string;
  release_year?: number;
  release_date?: Date;
  cover_url?: string;
  banner_url?: string;
  trailer_url?: string;
  developer_id?: number;
  publisher_id?: number;
  release_status: 'released' | 'early_access' | 'open_beta' | 'closed_beta' | 'alpha' | 'coming_soon' | 'in_development' | 'cancelled';
  availability_status: 'available' | 'out_of_catalog' | 'expired_license' | 'abandonware' | 'public_domain' | 'discontinued' | 'rereleased';
  discontinuation_date?: Date;
  official_abandonment_date?: Date;
  rerelease_date?: Date;
  abandonment_reason?: string;
  development_percentage?: number;
  age_rating?: string;
  average_rating?: number;
  total_reviews?: number;
  is_early_access?: boolean;
  was_rereleased?: boolean;
  rawg_id?: number;
  metacritic_score?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface GameCreationAttributes extends Optional<GameAttributes, 'id' | 'description' | 'synopsis' | 'release_year' | 'release_date' | 'cover_url' | 'banner_url' | 'trailer_url' | 'developer_id' | 'publisher_id' | 'discontinuation_date' | 'official_abandonment_date' | 'rerelease_date' | 'abandonment_reason' | 'development_percentage' | 'age_rating' | 'average_rating' | 'total_reviews' | 'is_early_access' | 'was_rereleased' | 'rawg_id' | 'metacritic_score' | 'created_at' | 'updated_at'> { }

class Game extends Model<GameAttributes, GameCreationAttributes> implements GameAttributes {
  public id!: number;
  public title!: string;
  public slug!: string;
  public description?: string;
  public synopsis?: string;
  public release_year?: number;
  public release_date?: Date;
  public cover_url?: string;
  public banner_url?: string;
  public trailer_url?: string;
  public developer_id?: number;
  public publisher_id?: number;
  public release_status!: 'released' | 'early_access' | 'open_beta' | 'closed_beta' | 'alpha' | 'coming_soon' | 'in_development' | 'cancelled';
  public availability_status!: 'available' | 'out_of_catalog' | 'expired_license' | 'abandonware' | 'public_domain' | 'discontinued' | 'rereleased';
  public discontinuation_date?: Date;
  public official_abandonment_date?: Date;
  public rerelease_date?: Date;
  public abandonment_reason?: string;
  public development_percentage?: number;
  public age_rating?: string;
  public average_rating?: number;
  public total_reviews?: number;
  public is_early_access?: boolean;
  public was_rereleased?: boolean;
  public rawg_id?: number;
  public metacritic_score?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Game.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    synopsis: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    release_year: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    release_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    cover_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    banner_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    trailer_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    developer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'developers',
        key: 'id',
      },
    },
    publisher_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'publishers',
        key: 'id',
      },
    },
    release_status: {
      type: DataTypes.ENUM('released', 'early_access', 'open_beta', 'closed_beta', 'alpha', 'coming_soon', 'in_development', 'cancelled'),
      defaultValue: 'released',
      allowNull: false
    },
    availability_status: {
      type: DataTypes.ENUM('available', 'out_of_catalog', 'expired_license', 'abandonware', 'public_domain', 'discontinued', 'rereleased'),
      defaultValue: 'available',
      allowNull: false
    },
    discontinuation_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    official_abandonment_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    rerelease_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    abandonment_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    development_percentage: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    age_rating: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    average_rating: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true
    },
    total_reviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true
    },
    is_early_access: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true
    },
    was_rereleased: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true
    },
    rawg_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    metacritic_score: {
      type: DataTypes.INTEGER,
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
    tableName: 'games',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['slug'], unique: true },
      { fields: ['title'] },
      { fields: ['developer_id'] },
      { fields: ['publisher_id'] },
      { fields: ['release_status'] },
      { fields: ['availability_status'] },
      { fields: ['release_year'] },
      { fields: ['release_date'] },
      { fields: ['average_rating'] },
      { fields: ['rawg_id'] },
    ],
  }
);

export default Game;
