const request = require('supertest');
const app = require('./app');

describe('Application Endpoints', () => {
  // ─── Root endpoint ──────────────────────────────────────────────────────────
  describe('GET /', () => {
    it('should return 200 and application info', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('ImmerVerse');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  // ─── Health endpoint ────────────────────────────────────────────────────────
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('memoryUsage');
      expect(res.body).toHaveProperty('hostname');
    });
  });

  // ─── Info endpoint ──────────────────────────────────────────────────────────
  describe('GET /api/info', () => {
    it('should return pipeline configuration info', async () => {
      const res = await request(app).get('/api/info');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('app');
      expect(res.body).toHaveProperty('pipeline');
      expect(res.body.pipeline).toHaveProperty('ci');
      expect(res.body.pipeline.ci).toBe('Jenkins');
    });
  });

  // ─── Metrics endpoint ───────────────────────────────────────────────────────
  describe('GET /metrics', () => {
    it('should return Prometheus-format metrics', async () => {
      const res = await request(app).get('/metrics');
      expect(res.statusCode).toBe(200);
      expect(res.text).toContain('http_requests_total');
      expect(res.text).toContain('nodejs_heap_size_bytes');
      expect(res.text).toContain('process_uptime_seconds');
    });
  });
});
