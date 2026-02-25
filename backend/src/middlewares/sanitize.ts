/**
 * Input Sanitization Middleware
 *
 * Recursively sanitizes all string values in req.body, req.query,
 * and req.params to prevent XSS attacks.  Also strips common
 * NoSQL-injection operators ($ prefixed keys).
 */
import { Request, Response, NextFunction } from 'express';

/**
 * Strip dangerous HTML / script content from a string.
 * Encodes the five XML special chars to their HTML entities.
 */
const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

/**
 * Walk an object recursively and sanitize every string leaf.
 * Removes keys that start with `$` (NoSQL injection pattern).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sanitizeValue = (value: any): any => {
  if (typeof value === 'string') {
    return escapeHtml(value.trim());
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      // Drop keys that look like NoSQL operators
      if (k.startsWith('$')) continue;
      cleaned[k] = sanitizeValue(v);
    }
    return cleaned;
  }
  return value;
};

/**
 * Express middleware – sanitizes body, query and params in-place.
 */
export const sanitizeInputs = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    // Only sanitize string values in query (Express parses them as strings)
    for (const key of Object.keys(req.query)) {
      const val = req.query[key];
      if (typeof val === 'string') {
        req.query[key] = escapeHtml(val.trim());
      }
    }
  }
  if (req.params && typeof req.params === 'object') {
    for (const key of Object.keys(req.params)) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = escapeHtml(req.params[key].trim());
      }
    }
  }
  next();
};
