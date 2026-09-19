import { test, expect } from '@playwright/test';

test.describe('Multilingual Literature Search (Wikimedia + Wikisource)', () => {
  test('Positive: GET /api/external/languages returns supported multilingual language list', async ({ request }) => {
    const res = await request.get('http://localhost:5000/api/external/languages');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.languages)).toBe(true);
    expect(body.languages.length).toBeGreaterThan(10);
    
    // Check key classical & modern languages
    const codes = body.languages.map((l: any) => l.code);
    expect(codes).toContain('kn'); // Kannada
    expect(codes).toContain('hi'); // Hindi
    expect(codes).toContain('ta'); // Tamil
    expect(codes).toContain('sa'); // Sanskrit
    expect(codes).toContain('en'); // English
  });

  test('Positive: Auto-detects Kannada script and returns literary search results', async ({ request }) => {
    const res = await request.get('http://localhost:5000/api/external/search?q=' + encodeURIComponent('ಕುವೆಂಪು'));
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.detectedLanguage).toBe('kn');
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.results[0]).toHaveProperty('title');
    expect(body.results[0]).toHaveProperty('sourceUrl');
    expect(body.results[0]).toHaveProperty('attribution');
  });

  test('Positive: Queries English public-domain literature with Wikisource check', async ({ request }) => {
    const res = await request.get('http://localhost:5000/api/external/search?q=Hamlet&lang=en');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.languageCode).toBe('en');
    expect(body.results.length).toBeGreaterThan(0);
    
    const hamlet = body.results.find((r: any) => r.title.toLowerCase().includes('hamlet'));
    expect(hamlet).toBeDefined();
    expect(hamlet.attribution.license).toContain('CC BY-SA');
  });

  test('Positive: Retrieves full work details and legal attribution for a literature title', async ({ request }) => {
    const res = await request.get('http://localhost:5000/api/external/work/en/Hamlet');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.work).toBeDefined();
    expect(body.work.title).toBe('Hamlet');
    expect(body.work.languageCode).toBe('en');
    expect(body.work.extract).toBeTruthy();
    expect(body.work.attribution.license).toContain('CC BY-SA');
    expect(body.work.attribution.source).toContain('Wikisource');
  });

  test('Negative: Empty search query returns 400 Bad Request', async ({ request }) => {
    const res = await request.get('http://localhost:5000/api/external/search?q=');
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Search query');
  });
});
