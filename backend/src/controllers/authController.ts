import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User';
import config from '../config/app';
import { AuthenticatedRequest } from '../middlewares/auth';

// Helper function to generate JWT token
const generateToken = (payload: { id: number; email: string; type: string }): string => {
  // Use 7 days in seconds as default, or parse the config value
  const expiresInSeconds = 7 * 24 * 60 * 60; // 7 days
  return jwt.sign(payload, config.jwt.secret, { expiresIn: expiresInSeconds });
};

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Email already registered.'
      });
      return;
    }

    // Hash password
    const password_hash = await User.hashPassword(password);

    // Create user
    const user = await User.create({
      name,
      email,
      password_hash,
      type: 'regular'
    });

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, type: user.type });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          type: user.type
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user.'
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
      return;
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
      return;
    }

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, type: user.type });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          type: user.type,
          avatar_url: user.avatar_url,
          bio: user.bio
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in.'
    });
  }
};

/**
 * Logout user (client-side token removal)
 * POST /api/auth/logout
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  // JWT is stateless, so logout is handled on client side
  // This endpoint is provided for consistency and future token blacklist implementation
  res.status(200).json({
    success: true,
    message: 'Logout successful. Please remove the token from client storage.'
  });
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.user?.id, {
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
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile.'
    });
  }
};
