/**
 * Validation Middleware
 *
 * A reusable middleware that checks express-validator results
 * and returns 400 with errors if validation fails.
 * Use after validation chain arrays on routes.
 */
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
    return;
  }
  next();
};
