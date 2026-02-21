/**
 * Token utility for generating secure random tokens and JWTs.
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config/app';

// JWT payload interface
export interface TokenPayload {
  id: number;
  email: string;
  type: string;
}

// Token pair returned on login
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate a cryptographically secure random hex token.
 */
export const generateSecureToken = (bytes = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hash a token for safe storage in the database.
 * Uses SHA-256 so we never store plaintext tokens.
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate a JWT access token (short-lived).
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '15m', // 15 minutes
  });
};

/**
 * Generate a JWT refresh token (long-lived).
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  const refreshSecret = config.jwt.secret + '_refresh';
  return jwt.sign(payload, refreshSecret, {
    expiresIn: '7d', // 7 days
  });
};

/**
 * Verify a JWT access token.
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
};

/**
 * Verify a JWT refresh token.
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  const refreshSecret = config.jwt.secret + '_refresh';
  return jwt.verify(token, refreshSecret) as TokenPayload;
};
