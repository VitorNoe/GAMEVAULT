import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

interface JwtConfig {
  secret: string;
  expiresIn: string;
}

interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string | string[];
  jwt: JwtConfig;
  rawgApiKey: string;
  isProduction: boolean;
}

// Validate required environment variables in production
const validateEnv = (): void => {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be set and at least 32 characters in production');
    }
  }
};

validateEnv();

// Parse CORS origins (comma-separated for multiple origins)
const parseCorsOrigin = (): string | string[] => {
  const origin = process.env.CORS_ORIGIN || 'http://localhost:3001';
  if (origin.includes(',')) {
    return origin.split(',').map(o => o.trim());
  }
  return origin;
};

const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: parseCorsOrigin(),
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_change_in_production_' + crypto.randomBytes(32).toString('hex'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  rawgApiKey: process.env.RAWG_API_KEY || '',
  isProduction: process.env.NODE_ENV === 'production'
};

export default config;
