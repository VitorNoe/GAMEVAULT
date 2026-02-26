import { Request, Response, NextFunction } from 'express';
import {
  httpRequestDuration,
  httpRequestTotal,
  httpErrorTotal,
  activeConnections,
} from '../config/metrics';

/**
 * Express middleware that records Prometheus metrics for every request:
 *   - request duration histogram
 *   - request counter
 *   - error counter (status >= 400)
 *   - active connections gauge
 */
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Skip the /metrics endpoint itself to avoid self-referencing noise
  if (req.path === '/metrics') {
    next();
    return;
  }

  activeConnections.inc();
  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    const route = normaliseRoute(req);
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    end(labels);
    httpRequestTotal.inc(labels);

    if (res.statusCode >= 400) {
      httpErrorTotal.inc(labels);
    }

    activeConnections.dec();
  });

  next();
};

/**
 * Derive a low-cardinality route label from the request.
 * Uses Express' matched route pattern when available, otherwise falls back to
 * a sanitised path to avoid high-cardinality metric explosion.
 */
function normaliseRoute(req: Request): string {
  // Express populates req.route when a named route matched
  if (req.route?.path) {
    return `${req.baseUrl}${req.route.path}`;
  }
  // Fallback: collapse numeric / UUID segments to avoid cardinality blow-up
  return req.baseUrl + req.path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/\d+/g, '/:id');
}

export default metricsMiddleware;
