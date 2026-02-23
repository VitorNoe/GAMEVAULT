import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type CollectionStatus = 'playing' | 'completed' | 'paused' | 'abandoned' | 'not_started' | 'wishlist' | 'backlog';

export interface UserCollectionAttributes {
    id: number;
    user_id: number;
    game_id: number;
    platform_id: number;
    format: 'physical' | 'digital';
    status: CollectionStatus;
    acquisition_date?: Date;
    price_paid?: number;
    hours_played: number;
    personal_notes?: string;
    rating?: number;
    created_at?: Date;
    updated_at?: Date;
}

interface UserCollectionCreationAttributes extends Optional<UserCollectionAttributes, 'id' | 'format' | 'status' | 'acquisition_date' | 'price_paid' | 'hours_played' | 'personal_notes' | 'rating' | 'created_at' | 'updated_at'> { }

class UserCollection extends Model<UserCollectionAttributes, UserCollectionCreationAttributes> implements UserCollectionAttributes {
    public id!: number;
    public user_id!: number;
    public game_id!: number;
    public platform_id!: number;
    public format!: 'physical' | 'digital';
    public status!: CollectionStatus;
    public acquisition_date?: Date;
    public price_paid?: number;
    public hours_played!: number;
    public personal_notes?: string;
    public rating?: number;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

UserCollection.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
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
            allowNull: false,
            references: {
                model: 'platforms',
                key: 'id',
            },
        },
        status: {
            type: DataTypes.ENUM('playing', 'completed', 'paused', 'abandoned', 'not_started', 'wishlist', 'backlog'),
            defaultValue: 'not_started',
            allowNull: false
        },
        format: {
            type: DataTypes.ENUM('physical', 'digital'),
            defaultValue: 'digital',
            allowNull: false
        },
        acquisition_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        price_paid: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        hours_played: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        personal_notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 1,
                max: 10,
            },
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
        tableName: 'user_collection',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['user_id'] },
            { fields: ['game_id'] },
            { fields: ['platform_id'] },
            { fields: ['status'] },
            { fields: ['user_id', 'game_id', 'platform_id'], unique: true },
        ],
    }
);

export default UserCollection;
