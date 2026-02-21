import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/app';
import User from '../models/User';

// Extend Express Request to include user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    type: string;
  };
}

// JWT payload interface
interface JwtPayload {
  id: number;
  email: string;
  type: string;
}

/**
 * Authentication middleware
 * Validates JWT token and attaches user info to request
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Check if user still exists
    const user = await User.findByPk(decoded.id);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User no longer exists.'
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      type: decoded.type
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
};

/**
 * Require email verification middleware
 * Must be used AFTER authenticate middleware.
 * Rejects requests from users whose email is not verified.
 */
export const requireVerified = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
      return;
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found.'
      });
      return;
    }

    if (!user.email_verified) {
      res.status(403).json({
        success: false,
        message: 'Email verification required. Please verify your email address.',
        code: 'EMAIL_NOT_VERIFIED'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('requireVerified error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization error.'
    });
  }
};

/**
 * Admin authorization middleware
 * Checks if authenticated user is an admin
 */
export const authorizeAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.type !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
    return;
  }
  next();
};

/**
 * Role-based authorization middleware factory
 * Checks if authenticated user has one of the allowed roles
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.type)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`
      });
      return;
    }
    next();
  };
};

/**
 * Optional authentication middleware
 * If token is provided and valid, attaches user to request
 * If no token or invalid, continues without user
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      
      // Verify user still exists in database
      const user = await User.findByPk(decoded.id);
      if (user) {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          type: decoded.type
        };
      }
    }
  } catch {
    // Token invalid or expired, continue without user
  }
  
  next();
};
