import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import routes from './routes';
import { errorHandler, notFound } from './middlewares';
import sequelize from './config/database';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration for frontend
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api', routes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to GameVault API',
    version: '1.0.0',
    health: '/api/health'
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Initialize database and start server
const startServer = async (): Promise<void> => {
  try {
    // Authenticate database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Skip automatic sync to avoid ENUM type conflicts
    // Use database/seed.sql for initial setup instead
    console.log('✅ Database models (sync disabled - using SQL scripts)');

    // Start periodic release status jobs
    const { startReleaseJobs } = await import('./jobs/releaseStatusJobs');
    startReleaseJobs();

    // Start server
    app.listen(PORT, () => {
      console.log(`🎮 GameVault API running on http://localhost:${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
      console.log(`✅ CORS enabled for: ${process.env.CORS_ORIGIN}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
