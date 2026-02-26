import rateLimit from 'express-rate-limit';

// Detectar ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * General API rate limiter
 * Development: 500 requests per 5 minutes
 * Production: 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
  windowMs: isDevelopment ? 5 * 60 * 1000 : 15 * 60 * 1000, // 5 or 15 minutes
  max: isDevelopment ? 500 : 100, // Much higher in development
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
});

/**
 * Authentication rate limiter
 * Development: 50 requests per 5 minutes (muito mais permissivo)
 * Production: 10 requests per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: isDevelopment ? 5 * 60 * 1000 : 15 * 60 * 1000, // 5 or 15 minutes
  max: isDevelopment ? 50 : 10, // Very permissive in development
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
});

/**
 * Create resource rate limiter
 * Development: 200 requests per 5 minutes
 * Production: 30 requests per 15 minutes
 */
export const createLimiter = rateLimit({
  windowMs: isDevelopment ? 5 * 60 * 1000 : 15 * 60 * 1000, // 5 or 15 minutes
  max: isDevelopment ? 200 : 30, // Much higher in development
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many creation requests, please try again later.'
  },
});

/**
 * Admin route rate limiter
 * Development: 300 requests per 5 minutes
 * Production: 60 requests per 15 minutes
 */
export const adminLimiter = rateLimit({
  windowMs: isDevelopment ? 5 * 60 * 1000 : 15 * 60 * 1000,
  max: isDevelopment ? 300 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many admin requests, please try again later.'
  },
});
