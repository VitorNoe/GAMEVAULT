import { Request, Response, NextFunction } from 'express';
import { ValidationError, UniqueConstraintError, DatabaseError } from 'sequelize';
import { AppError } from '../utils/AppError';
import { Sentry } from '../config/sentry';

/**
 * Enhanced error handling middleware with specific error types
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error for debugging (use structured logging in production)
  console.error(`[${new Date().toISOString()}] Error:`, {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Report non-client errors to Sentry
  if (!(err instanceof AppError && err.statusCode < 500)) {
    Sentry.captureException(err);
  }

  // Handle AppError (our custom error)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.code && { code: err.code })
    });
    return;
  }

  // Handle Sequelize Validation Errors
  if (err instanceof ValidationError) {
    const messages = err.errors.map(e => e.message);
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: messages
    });
    return;
  }

  // Handle Sequelize Unique Constraint Errors
  if (err instanceof UniqueConstraintError) {
    res.status(409).json({
      success: false,
      message: 'Resource already exists',
      errors: err.errors.map(e => e.message)
    });
    return;
  }

  // Handle Database Errors
  if (err instanceof DatabaseError) {
    res.status(500).json({
      success: false,
      message: 'Database error occurred'
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired'
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error'
  });
};

/**
 * Not found middleware
 */
export const notFound = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
};
