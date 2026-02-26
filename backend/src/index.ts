import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

import routes from './routes';
import { errorHandler, notFound } from './middlewares';
import { sanitizeInputs } from './middlewares/sanitize';
import sequelize from './config/database';
import swaggerSpec from './config/swagger';
import appConfig from './config/app';

// ─── Observability ────────────────────────────────────────────────────
import initSentry, { Sentry } from './config/sentry';
import metricsMiddleware from './middlewares/metrics';
import metricsRegister from './config/metrics';

dotenv.config();

// Sentry must be initialised before any other middleware / imports that
// should be instrumented.
initSentry();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// ─── Prometheus metrics middleware (must be early) ────────────────────
app.use(metricsMiddleware);

// ─── Security Headers (helmet) ────────────────────────────────────────
// Relaxed CSP only for the Swagger UI path; strict for everything else.
app.use(
  '/api/docs',
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: appConfig.isProduction ? [] : null,
      },
    },
    // Enforce HSTS in production (browsers remember HTTPS for 1 year)
    hsts: appConfig.isProduction
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  })
);

// ─── CORS – use configured origins instead of blanket allow ───────────
app.use(cors({
  origin: appConfig.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // preflight cache 24 h
}));

// ─── Body parsing ─────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── HTTP Parameter Pollution protection ──────────────────────────────
app.use(hpp());

// ─── Input sanitization (XSS / NoSQL-injection) ──────────────────────
app.use(sanitizeInputs);

// Serve local uploads (static files)
import storageConfig from './config/storage';
if (storageConfig.provider === 'local') {
  app.use(storageConfig.local.serveBase, express.static(storageConfig.local.uploadDir));
}

// Swagger API documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'GameVault API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'list',
    filter: true,
  },
}));

// Serve the raw OpenAPI JSON spec
app.get('/api/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ─── Prometheus metrics endpoint ──────────────────────────────────────
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', metricsRegister.contentType);
    res.end(await metricsRegister.metrics());
  } catch (err) {
    res.status(500).end(String(err));
  }
});

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

// Sentry error handler must come AFTER routes but BEFORE our custom handler
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

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

    // Start RAWG periodic sync job
    const { startRawgSyncJob } = await import('./jobs/rawgSyncJob');
    startRawgSyncJob();

    // Start server
    app.listen(PORT, () => {
      console.log(`🎮 GameVault API running on http://localhost:${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
      console.log(`✅ CORS enabled for: ${process.env.CORS_ORIGIN}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📖 API Docs: http://localhost:${PORT}/api/docs`);
      console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
