import { Request, Response } from 'express';
import Platform from '../models/Platform';

/**
 * Get all platforms
 * GET /api/platforms
 */
export const getAllPlatforms = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, manufacturer } = req.query;

    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }

    if (manufacturer) {
      where.manufacturer = manufacturer;
    }

    const platforms = await Platform.findAll({
      where,
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: { platforms }
    });
  } catch (error) {
    console.error('Get all platforms error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching platforms.'
    });
  }
};

/**
 * Get platform by ID
 * GET /api/platforms/:id
 */
export const getPlatformById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const platform = await Platform.findByPk(id);

    if (!platform) {
      res.status(404).json({
        success: false,
        message: 'Platform not found.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { platform }
    });
  } catch (error) {
    console.error('Get platform by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching platform.'
    });
  }
};

/**
 * Create new platform (admin only)
 * POST /api/platforms
 */
export const createPlatform = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      slug,
      manufacturer,
      type,
      generation,
      release_year,
      discontinuation_year,
      logo_url,
      primary_color
    } = req.body;

    // Check if slug already exists
    const existingPlatform = await Platform.findOne({ where: { slug } });
    if (existingPlatform) {
      res.status(400).json({
        success: false,
        message: 'A platform with this slug already exists.'
      });
      return;
    }

    const platform = await Platform.create({
      name,
      slug,
      manufacturer,
      type,
      generation,
      release_year,
      discontinuation_year,
      logo_url,
      primary_color
    });

    res.status(201).json({
      success: true,
      message: 'Platform created successfully.',
      data: { platform }
    });
  } catch (error) {
    console.error('Create platform error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating platform.'
    });
  }
};

/**
 * Update platform (admin only)
 * PUT /api/platforms/:id
 */
export const updatePlatform = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const platform = await Platform.findByPk(id);
    if (!platform) {
      res.status(404).json({
        success: false,
        message: 'Platform not found.'
      });
      return;
    }

    // Update fields
    const updateFields = [
      'name', 'manufacturer', 'type', 'generation',
      'release_year', 'discontinuation_year', 'logo_url', 'primary_color'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        (platform as unknown as Record<string, unknown>)[field] = req.body[field];
      }
    });

    await platform.save();

    res.status(200).json({
      success: true,
      message: 'Platform updated successfully.',
      data: { platform }
    });
  } catch (error) {
    console.error('Update platform error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating platform.'
    });
  }
};

/**
 * Delete platform (admin only)
 * DELETE /api/platforms/:id
 */
export const deletePlatform = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const platform = await Platform.findByPk(id);
    if (!platform) {
      res.status(404).json({
        success: false,
        message: 'Platform not found.'
      });
      return;
    }

    await platform.destroy();

    res.status(200).json({
      success: true,
      message: 'Platform deleted successfully.'
    });
  } catch (error) {
    console.error('Delete platform error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting platform.'
    });
  }
};
