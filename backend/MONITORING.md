# Monitoring & Observability Guide

This document explains how **error tracking** (Sentry) and **application metrics**
(Prometheus) are configured in the GameVault backend.

---

## 1. Sentry – Error Tracking

### What it does

[Sentry](https://sentry.io) captures unhandled exceptions, promise rejections and
any error that reaches the Express error-handling middleware. It also records
breadcrumbs that show the trail of events leading up to an error, making
debugging significantly easier.

### Configuration

| Environment variable | Purpose | Default |
|---|---|---|
| `SENTRY_DSN` | Sentry project DSN (required to enable) | _(empty – disabled)_ |
| `SENTRY_TRACES_SAMPLE_RATE` | Fraction of requests to trace for performance (0-1) | `0.2` |
| `NODE_ENV` | Sets the Sentry `environment` tag | `development` |

> **Tip:** You can obtain a free DSN by creating a project at
> <https://sentry.io> → _Projects_ → _Create Project_ → _Node.js / Express_.

### Enabling Sentry

Add the DSN to your `.env` file (or docker-compose environment):

```env
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
```

Restart the backend. You should see:

```
✅ Sentry initialised (env=development)
```

### Verifying events

The easiest way to fire a test event is to trigger a 500 error. You can also
add a temporary route while developing:

```ts
app.get('/debug-sentry', () => {
  throw new Error('Sentry test error');
});
```

Open your Sentry dashboard → _Issues_ and the error should appear within
seconds.

### What is captured

* All unhandled exceptions and unhandled promise rejections.
* Errors that fall through to the Express `errorHandler` middleware
  (only server-side 5xx errors; 4xx client errors are **not** reported).
* Performance traces at the configured sample rate.
* Breadcrumbs (HTTP requests, console logs, DB queries).

### Sensitive data

`Authorization` and `Cookie` headers are stripped before events leave the
server (see `beforeSend` hook in `src/config/sentry.ts`). PII sending is
disabled by default (`sendDefaultPii: false`).

---

## 2. Prometheus Metrics

### What it does

The backend exposes a **`GET /metrics`** endpoint that returns metrics in the
Prometheus text exposition format. A Prometheus server (or any compatible
scraper) can collect these metrics and you can visualise them in Grafana or
similar tools.

### Available metrics

| Metric name | Type | Labels | Description |
|---|---|---|---|
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status_code` | Latency of HTTP requests |
| `http_requests_total` | Counter | `method`, `route`, `status_code` | Total HTTP requests |
| `http_errors_total` | Counter | `method`, `route`, `status_code` | HTTP responses with status ≥ 400 |
| `db_query_duration_seconds` | Histogram | `operation` | Duration of Sequelize queries |
| `db_queries_total` | Counter | `operation` | Total database queries |
| `app_active_connections` | Gauge | — | Currently active HTTP connections |
| _(default Node.js metrics)_ | various | — | CPU, memory, event-loop lag, GC, etc. |

### Accessing metrics

```bash
curl http://localhost:3000/metrics
```

### Prometheus scrape config

Add the following to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'gamevault-backend'
    scrape_interval: 15s
    metrics_path: /metrics
    static_configs:
      - targets: ['backend:3000']   # adjust host/port as needed
```

### Example docker-compose additions

To run a full monitoring stack alongside the backend, you can add:

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - '9090:9090'

  grafana:
    image: grafana/grafana:latest
    ports:
      - '3030:3000'
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

Then import a Node.js / Express dashboard in Grafana (e.g. dashboard ID **11159**).

---

## 3. Viewing Logs

In **development** the backend writes structured log lines to stdout. Use
`docker compose logs -f backend` (or check your terminal) to follow them in
real time.

For **staging / production**, pipe stdout to a log aggregator such as:

* **ELK Stack** (Elasticsearch + Logstash + Kibana)
* **Loki + Grafana**
* **Datadog Logs**

Since Sentry captures error-level events automatically, the most critical
errors are always visible in the Sentry dashboard even without a full logging
pipeline.

---

## 4. Quick-Start Checklist

1. Set `SENTRY_DSN` in your environment.
2. Start the backend (`npm run dev` or `docker compose up`).
3. Verify Sentry: trigger a test error and check the Sentry UI.
4. Verify metrics: `curl http://localhost:3000/metrics`.
5. (Optional) Spin up Prometheus + Grafana for dashboards.
