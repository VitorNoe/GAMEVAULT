import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import User from '../models/User';
import { getPaginationParams, getPaginationResult, parseId, updateObjectFields } from '../utils/helpers';
import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

/**
 * Get current user statistics
 * GET /api/users/me/stats
 */
export const getUserStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated.'
      });
      return;
    }

    // Get collection count
    const collectionResult = await sequelize.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM user_collection WHERE user_id = :userId',
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    const collectionCount = parseInt(collectionResult[0]?.count || '0', 10);

    // Get wishlist count
    const wishlistResult = await sequelize.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM wishlist WHERE user_id = :userId',
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    const wishlistCount = parseInt(wishlistResult[0]?.count || '0', 10);

    // Get playing now count (status = 'playing')
    const playingResult = await sequelize.query<{ count: string }>(
      "SELECT COUNT(*) as count FROM user_collection WHERE user_id = :userId AND status = 'playing'",
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    const playingCount = parseInt(playingResult[0]?.count || '0', 10);

    // Get completed games count
    const completedResult = await sequelize.query<{ count: string }>(
      "SELECT COUNT(*) as count FROM user_collection WHERE user_id = :userId AND status = 'completed'",
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    const completedCount = parseInt(completedResult[0]?.count || '0', 10);

    // Get reviews count
    const reviewsResult = await sequelize.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM reviews WHERE user_id = :userId',
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    const reviewsCount = parseInt(reviewsResult[0]?.count || '0', 10);

    // Get unread notifications count
    const notificationsResult = await sequelize.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = :userId AND read_at IS NULL',
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    const notificationsCount = parseInt(notificationsResult[0]?.count || '0', 10);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          collection: collectionCount,
          wishlist: wishlistCount,
          playing: playingCount,
          completed: completedCount,
          reviews: reviewsCount,
          notifications: notificationsCount
        }
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics.'
    });
  }
};

/**
 * Get all users with pagination (admin only)
 * GET /api/users
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationParams(req);

    const { count, rows: users } = await User.findAndCountAll({
      attributes: { exclude: ['password_hash'] },
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: getPaginationResult(count, page, limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users.'
    });
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID.'
      });
      return;
    }

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user.'
    });
  }
};

/**
 * Update current user profile
 * PUT /api/users/me
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.user?.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.'
      });
      return;
    }

    // Update fields using helper
    updateObjectFields(user, req.body, ['name', 'bio', 'avatar_url']);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          bio: user.bio,
          avatar_url: user.avatar_url,
          type: user.type
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile.'
    });
  }
};

/**
 * Delete user (admin only)
 * DELETE /api/users/:id
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.'
      });
      return;
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully.'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user.'
    });
  }
};
