'use strict';

const express = require('express');
const os = require('os');
const process = require('process');

const app = express();
app.use(express.json());

// ─── Prometheus metrics (minimal, no extra library needed) ────────────────────
let requestCount = 0;
let requestDurations = [];

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    requestCount++;
    requestDurations.push(Date.now() - start);
  });
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '🚀 ImmerVerse CI/CD Sample App is running!',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    hostname: os.hostname(),
    platform: os.platform(),
    nodeVersion: process.version,
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    app: 'ImmerVerse CI/CD Demo',
    description: 'A sample application to demonstrate a full CI/CD pipeline',
    author: 'DevOps Engineer',
    pipeline: {
      ci: 'Jenkins',
      registry: 'Docker Hub / Amazon ECR',
      orchestration: 'Kubernetes',
      monitoring: 'Prometheus + Grafana',
    },
  });
});

// ─── Prometheus-compatible metrics endpoint ───────────────────────────────────
app.get('/metrics', (req, res) => {
  const memUsage = process.memoryUsage();
  const avgDuration =
    requestDurations.length > 0
      ? requestDurations.reduce((a, b) => a + b, 0) / requestDurations.length
      : 0;

  const metrics = [
    '# HELP http_requests_total Total number of HTTP requests',
    '# TYPE http_requests_total counter',
    `http_requests_total ${requestCount}`,
    '',
    '# HELP nodejs_heap_size_bytes Heap memory size in bytes',
    '# TYPE nodejs_heap_size_bytes gauge',
    `nodejs_heap_size_bytes ${memUsage.heapUsed}`,
    '',
    '# HELP nodejs_rss_bytes RSS memory in bytes',
    '# TYPE nodejs_rss_bytes gauge',
    `nodejs_rss_bytes ${memUsage.rss}`,
    '',
    '# HELP http_request_duration_avg_ms Average request duration in ms',
    '# TYPE http_request_duration_avg_ms gauge',
    `http_request_duration_avg_ms ${avgDuration.toFixed(2)}`,
    '',
    '# HELP process_uptime_seconds Process uptime in seconds',
    '# TYPE process_uptime_seconds gauge',
    `process_uptime_seconds ${process.uptime().toFixed(2)}`,
  ].join('\n');

  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(metrics);
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅  Server started on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Version     : ${process.env.APP_VERSION || '1.0.0'}`);
});

module.exports = app;
