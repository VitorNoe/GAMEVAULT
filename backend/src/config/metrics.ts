import client, { Registry, Histogram, Counter, Gauge } from 'prom-client';

/**
 * Centralised Prometheus metrics registry and standard metric definitions.
 *
 * All metrics are collected via prom-client and exposed at GET /metrics.
 */

// Use a dedicated registry so we don't pollute the global one
const register = new Registry();

// Collect default Node.js metrics (CPU, memory, event-loop lag, etc.)
client.collectDefaultMetrics({ register });

// ── HTTP request metrics ──────────────────────────────────────────────

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [register],
});

export const httpErrorTotal = new Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP responses with status >= 400',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [register],
});

// ── Database query metrics ────────────────────────────────────────────

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database (Sequelize) queries in seconds',
  labelNames: ['operation'] as const,
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register],
});

export const dbQueryTotal = new Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation'] as const,
  registers: [register],
});

// ── Application gauges ────────────────────────────────────────────────

export const activeConnections = new Gauge({
  name: 'app_active_connections',
  help: 'Number of currently active HTTP connections',
  registers: [register],
});

export { register, client };
export default register;
