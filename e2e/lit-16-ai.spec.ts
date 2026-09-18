import { test, expect } from '@playwright/test';

test.describe('Literature AI Integration Suite', () => {
  const baseURL = 'http://localhost:5000';
  let readerToken = '';
  let adminToken = '';

  test.beforeAll(async ({ request }) => {
    // Register unique Reader
    const readerRes = await request.post(`${baseURL}/api/auth/register`, {
      data: {
        name: 'AI Reader Test',
        email: `ai_reader_${Date.now()}@literature.org`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      },
    });
    if (readerRes.ok()) {
      const body = await readerRes.json();
      readerToken = body.token;
    }

    // Register unique Admin
    const adminRes = await request.post(`${baseURL}/api/auth/register`, {
      data: {
        name: 'AI Admin Curator',
        email: `ai_admin_${Date.now()}@literature.org`,
        password: 'AdminPassword123!',
        confirmPassword: 'AdminPassword123!',
        adminSecret: 'ath_cur_sec_9f83a27e4b1c8d5062a4192d',
      },
    });
    if (adminRes.ok()) {
      const body = await adminRes.json();
      adminToken = body.token;
    }
  });

  test('Negative: AI endpoints reject unauthenticated access', async ({ request }) => {
    // Summarize without token -> 401
    const resSummary = await request.post(`${baseURL}/api/ai/summarize`, {
      data: { title: 'Hamlet', content: 'To be, or not to be...' },
    });
    expect(resSummary.status()).toBe(401);

    // Explain without token -> 401
    const resExplain = await request.post(`${baseURL}/api/ai/explain`, {
      data: { title: 'Hamlet', content: 'To be, or not to be...' },
    });
    expect(resExplain.status()).toBe(401);

    // Translate without token -> 401
    const resTranslate = await request.post(`${baseURL}/api/ai/translate`, {
      data: { text: 'Hello', targetLanguage: 'Hindi' },
    });
    expect(resTranslate.status()).toBe(401);

    // Admin endpoints without token -> 401
    const resBrief = await request.post(`${baseURL}/api/ai/generate-brief`, {
      data: { title: 'Iliad', content: 'Sing in me, Muse...' },
    });
    expect(resBrief.status()).toBe(401);

    const resArtCraft = await request.post(`${baseURL}/api/ai/art-craft`, {
      data: { name: 'Channapatna Toys', state: 'Karnataka' },
    });
    expect(resArtCraft.status()).toBe(401);
  });

  test('Negative & Authorization: Reader role cannot call Admin AI endpoints', async ({ request }) => {
    expect(readerToken).toBeTruthy();

    // Reader attempts to call /api/ai/generate-brief -> Should be 403 Forbidden
    const forbiddenBrief = await request.post(`${baseURL}/api/ai/generate-brief`, {
      headers: { Authorization: `Bearer ${readerToken}` },
      data: { title: 'The Odyssey', content: 'Tell me, O Muse...' },
    });
    expect(forbiddenBrief.status()).toBe(403);

    // Reader attempts to call /api/ai/generate-tags -> Should be 403 Forbidden
    const forbiddenTags = await request.post(`${baseURL}/api/ai/generate-tags`, {
      headers: { Authorization: `Bearer ${readerToken}` },
      data: { title: 'The Odyssey', content: 'Tell me, O Muse...' },
    });
    expect(forbiddenTags.status()).toBe(403);

    // Reader attempts to call /api/ai/art-craft -> Should be 403 Forbidden
    const forbiddenCraft = await request.post(`${baseURL}/api/ai/art-craft`, {
      headers: { Authorization: `Bearer ${readerToken}` },
      data: { name: 'Mysore Silk', state: 'Karnataka' },
    });
    expect(forbiddenCraft.status()).toBe(403);
  });

  test('Input validation & length restriction: Rejects oversized payload', async ({ request }) => {
    expect(readerToken).toBeTruthy();

    // Giant text > 15,000 characters
    const oversizedText = 'A'.repeat(16000);
    const resOversized = await request.post(`${baseURL}/api/ai/summarize`, {
      headers: { Authorization: `Bearer ${readerToken}` },
      data: { title: 'Oversized', content: oversizedText },
    });
    expect(resOversized.status()).toBe(400);
    const body = await resOversized.json();
    expect(body.error).toContain('exceeds the maximum permissible limit');
  });

  test('Negative: Empty content rejected with 400 Bad Request', async ({ request }) => {
    expect(readerToken).toBeTruthy();

    const resEmpty = await request.post(`${baseURL}/api/ai/summarize`, {
      headers: { Authorization: `Bearer ${readerToken}` },
      data: { title: 'Empty Work', content: '   ' },
    });
    expect(resEmpty.status()).toBe(400);
  });

  test('Graceful failure or valid AI response without leaking secrets', async ({ request }) => {
    expect(readerToken).toBeTruthy();

    const resAi = await request.post(`${baseURL}/api/ai/summarize`, {
      headers: { Authorization: `Bearer ${readerToken}` },
      data: { title: 'Hamlet', content: 'To be, or not to be, that is the question.' },
    });
    
    // Either 200 (if live GEMINI_API_KEY valid) or 503 (temporarily unavailable)
    expect([200, 503]).toContain(resAi.status());

    const body = await resAi.json();
    const strBody = JSON.stringify(body);
    expect(strBody).not.toContain('GEMINI_API_KEY');
    expect(strBody).not.toContain('stack');
    expect(strBody).not.toContain('password');
  });

  test('Admin authorized access: Admin can call generate-brief and art-craft endpoints', async ({ request }) => {
    expect(adminToken).toBeTruthy();

    const resBrief = await request.post(`${baseURL}/api/ai/generate-brief`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { title: 'The Divine Comedy', content: 'Midway upon the journey of our life...' },
    });
    expect([200, 503]).toContain(resBrief.status());

    const resCraft = await request.post(`${baseURL}/api/ai/art-craft`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { name: 'Bidriware', state: 'Karnataka' },
    });
    expect([200, 503]).toContain(resCraft.status());
  });
});
