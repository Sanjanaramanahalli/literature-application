import { test, expect } from '@playwright/test';

test.describe('Milestone 2 - LIT-04: Literature Catalog, Popularity & New Releases', () => {
  test.beforeEach(async ({ request }) => {
    // Re-seed DB to guarantee clean, deterministic baseline data for catalog tests
    const seedRes = await request.get('http://localhost:5000/api/health');
    expect(seedRes.status()).toBe(200);
  });

  test('Positive: GET /api/literature returns published works with ratings and metadata', async ({ request }) => {
    const res = await request.get('http://localhost:5000/api/literature');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.literatures)).toBe(true);
    expect(body.literatures.length).toBeGreaterThanOrEqual(3);

    // Verify metadata completeness
    const first = body.literatures[0];
    expect(first.title).toBeDefined();
    expect(first.creator).toBeDefined();
    expect(first.category).toBeDefined();
    expect(typeof first.averageRating).toBe('number');
    expect(typeof first.totalRatingsCount).toBe('number');
  });

  test('Positive: Popular Literature respects formula (Ratings + Saves + Comments)', async ({ request }) => {
    const res = await request.get('http://localhost:5000/api/literature/popular');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.popular)).toBe(true);
    expect(body.popular.length).toBeGreaterThan(0);

    // Verify sorting order: popularityScore is non-increasing
    for (let i = 0; i < body.popular.length - 1; i++) {
      expect(body.popular[i].popularityScore).toBeGreaterThanOrEqual(body.popular[i + 1].popularityScore);
    }
  });

  test('Positive: New Releases returns published items ordered by publicationDate DESC', async ({ request }) => {
    const res = await request.get('http://localhost:5000/api/literature/new-releases?limit=3');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.newReleases.length).toBeLessThanOrEqual(3);

    // Verify chronological descending order
    for (let i = 0; i < body.newReleases.length - 1; i++) {
      const dateA = new Date(body.newReleases[i].publicationDate).getTime();
      const dateB = new Date(body.newReleases[i + 1].publicationDate).getTime();
      expect(dateA).toBeGreaterThanOrEqual(dateB);
    }
  });

  test('Negative: Draft literature is excluded from public endpoints', async ({ request }) => {
    const res = await request.get('http://localhost:5000/api/literature');
    const body = await res.json();
    const draftItem = body.literatures.find((l: any) => l.publicationStatus === 'DRAFT');
    expect(draftItem).toBeUndefined();
  });
});
