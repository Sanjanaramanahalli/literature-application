import { test, expect } from '@playwright/test';

test.describe('Milestone 1 - LIT-01: System Scaffolding & Health Verification', () => {
  test('Positive: Backend health endpoint responds with database connected', async ({ request }) => {
    const response = await request.get('http://localhost:5000/api/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('online');
    expect(body.database).toBe('connected');
    expect(body.service).toContain('Classic Literature Application API');
  });

  test('Negative: Unrecognized backend routes return 404 Endpoint Not Found', async ({ request }) => {
    const response = await request.get('http://localhost:5000/api/non-existent-route-xyz');
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('Endpoint Not Found');
  });
});
