import * as Sentry from '@sentry/node';
import appConfig from './app';

/**
 * Initialize Sentry for error tracking and performance monitoring.
 *
 * Set the SENTRY_DSN environment variable to enable reporting.
 * In development the SDK still loads but events are only sent when a DSN is
 * configured, so local runs stay quiet unless you opt in.
 */
export const initSentry = (): void => {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.log('ℹ️  Sentry DSN not configured – error reporting disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: appConfig.nodeEnv,
    release: `gamevault-backend@${process.env.npm_package_version ?? '1.0.0'}`,

    // Capture 100 % of errors; tune down in high-traffic production
    sampleRate: 1.0,

    // Performance / tracing sample rate (PoC – keep at 20 %)
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.2'),

    // Attach server name so we can tell instances apart
    serverName: process.env.HOSTNAME ?? 'gamevault-backend',

    // Breadcrumb defaults are fine; we add custom ones in the middleware
    integrations: [
      // Automatically capture unhandled exceptions & rejections
      Sentry.onUnhandledRejectionIntegration({ mode: 'warn' }),
    ],

    // Do not send PII by default
    sendDefaultPii: false,

    // Ignore health-check noise
    ignoreErrors: ['HealthCheckOK'],

    beforeSend(event) {
      // Strip sensitive headers before sending
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });

  console.log(`✅ Sentry initialised (env=${appConfig.nodeEnv})`);
};

export { Sentry };
export default initSentry;
