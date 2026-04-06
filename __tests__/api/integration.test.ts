import { describe, it, expect } from '@jest/globals';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const res = await fetch(`${BASE_URL}/api/health`);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.status).toBeDefined();
    });
  });

  describe('Metrics', () => {
    it('should return Prometheus metrics', async () => {
      const res = await fetch(`${BASE_URL}/api/metrics`);
      const text = await res.text();
      
      expect(res.status).toBe(200);
      expect(text).toContain('http_requests_total');
    });
  });

  describe('Authentication', () => {
    it('should require auth for protected routes', async () => {
      const res = await fetch(`${BASE_URL}/api/notes/generate`, {
        method: 'POST'
      });
      
      expect(res.status).toBe(401);
    });
  });
});
