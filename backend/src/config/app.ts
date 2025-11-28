import dotenv from 'dotenv';

dotenv.config();

interface JwtConfig {
  secret: string;
  expiresIn: string;
}

interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  jwt: JwtConfig;
  rawgApiKey: string;
}

const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  rawgApiKey: process.env.RAWG_API_KEY || ''
};

export default config;
