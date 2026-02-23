import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface ReviewLikeAttributes {
  review_id: number;
  user_id: number;
  like_type: 'like' | 'dislike';
  created_at?: Date;
}

class ReviewLike extends Model<ReviewLikeAttributes> implements ReviewLikeAttributes {
  public review_id!: number;
  public user_id!: number;
  public like_type!: 'like' | 'dislike';
  public readonly created_at!: Date;
}

ReviewLike.init(
  {
    review_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'reviews',
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
    like_type: {
      type: DataTypes.ENUM('like', 'dislike'),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'review_likes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['review_id'] },
      { fields: ['user_id'] },
    ],
  }
);

export default ReviewLike;
