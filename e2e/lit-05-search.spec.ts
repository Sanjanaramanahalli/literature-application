import { test, expect } from '@playwright/test';

test.describe('Milestone 2 - LIT-05: Advanced Multi-Field Search Engine', () => {
  test('Positive: Multi-criteria search by Author="Shakespeare" and Category="Drama" returns Hamlet', async ({ request }) => {
    const res = await request.get('http://localhost:5000/api/search/advanced?author=Shakespeare&category=Drama');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.results[0].title).toContain('Hamlet');
    expect(body.results[0].creator.name).toContain('Shakespeare');
  });

  test('Positive: Search by Subject="Mortality" returns Ivan Ilyich', async ({ request }) => {
    const res = await request.get('http://localhost:5000/api/search/advanced?subject=Mortality');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.results[0].title).toContain('Death of Ivan Ilyich');
  });

  test('Positive: Search by Tag="Modernism" returns Virginia Woolf', async ({ request }) => {
    const res = await request.get('http://localhost:5000/api/search/advanced?tag=Modernism');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.results[0].creator.name).toContain('Virginia Woolf');
  });

  test('Negative: Non-existent search query returns 0 results gracefully without error', async ({ request }) => {
    const res = await request.get('http://localhost:5000/api/search/advanced?title=NonExistentBookXYZ12345');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.results).toEqual([]);
  });
});
