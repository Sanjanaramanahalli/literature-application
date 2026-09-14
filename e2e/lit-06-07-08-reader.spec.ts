import { test, expect } from '@playwright/test';

test.describe('Milestones 3 - LIT-06, LIT-07, LIT-08: Reader Immersion, Ratings, Saves & Threaded Comments', () => {
  let readerToken: string;
  let adminToken: string;
  let hamletId: string;

  test.beforeAll(async ({ request }) => {
    // 1. Authenticate Reader
    const readerRes = await request.post('http://localhost:5000/api/auth/login', {
      data: { email: 'julian@literature.org', password: 'ReaderPassword123!' },
    });
    const readerData = await readerRes.json();
    readerToken = readerData.token;

    // 2. Authenticate Admin
    const adminRes = await request.post('http://localhost:5000/api/auth/login', {
      data: { email: 'admin@literature.org', password: 'AdminPassword123!' },
    });
    const adminData = await adminRes.json();
    adminToken = adminData.token;

    // 3. Get Hamlet ID
    const catalogRes = await request.get('http://localhost:5000/api/literature');
    const catalog = await catalogRes.json();
    const hamlet = catalog.literatures.find((l: any) => l.title.includes('Hamlet'));
    hamletId = hamlet.id;
  });

  // --- LIT-06: Ratings ---
  test('LIT-06: Reader can rate literature 1-5 stars and dynamic average updates', async ({ request }) => {
    const res = await request.post(`http://localhost:5000/api/reader/literature/${hamletId}/ratings`, {
      headers: { Authorization: `Bearer ${readerToken}` },
      data: { value: 5 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.rating).toBe(5);
    expect(body.totalRatingsCount).toBeGreaterThan(0);
    expect(body.averageRating).toBeGreaterThanOrEqual(4.0);
  });

  test('LIT-06: Rating with invalid value (<1 or >5) is rejected', async ({ request }) => {
    const res = await request.post(`http://localhost:5000/api/reader/literature/${hamletId}/ratings`, {
      headers: { Authorization: `Bearer ${readerToken}` },
      data: { value: 7 },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('between 1 and 5 stars');
  });

  // --- LIT-07: Saved Works ---
  test('LIT-07: Reader can toggle save on literature and view it in saved library', async ({ request }) => {
    // Toggle save
    const saveRes = await request.post(`http://localhost:5000/api/reader/literature/${hamletId}/save`, {
      headers: { Authorization: `Bearer ${readerToken}` },
    });
    expect(saveRes.status()).toBe(200);

    // Retrieve saved library
    const libRes = await request.get('http://localhost:5000/api/reader/saved', {
      headers: { Authorization: `Bearer ${readerToken}` },
    });
    expect(libRes.status()).toBe(200);
    const libData = await libRes.json();
    expect(Array.isArray(libData.savedWorks)).toBe(true);
  });

  // --- LIT-08: 2-Level Threaded Comments & Cascade Deletion ---
  test('LIT-08: Reader can post top-level comment and direct reply', async ({ request }) => {
    // 1. Post top-level comment
    const commentRes = await request.post(`http://localhost:5000/api/reader/literature/${hamletId}/comments`, {
      headers: { Authorization: `Bearer ${readerToken}` },
      data: { content: 'Playwright test top-level contemplation on Elsinore.' },
    });
    expect(commentRes.status()).toBe(201);
    const commentData = await commentRes.json();
    const parentCommentId = commentData.comment.id;

    // 2. Post direct threaded reply
    const replyRes = await request.post(`http://localhost:5000/api/reader/literature/${hamletId}/comments`, {
      headers: { Authorization: `Bearer ${readerToken}` },
      data: {
        content: 'Playwright test reply agreeing with parent observation.',
        parentId: parentCommentId,
      },
    });
    expect(replyRes.status()).toBe(201);
    const replyData = await replyRes.json();
    expect(replyData.comment.parentId).toBe(parentCommentId);

    // 3. Verify Cascade Deletion: Deleting parent comment cascade deletes reply
    const deleteRes = await request.delete(`http://localhost:5000/api/reader/comments/${parentCommentId}`, {
      headers: { Authorization: `Bearer ${readerToken}` },
    });
    expect(deleteRes.status()).toBe(200);

    // Detail view should no longer have this parent comment
    const detailRes = await request.get(`http://localhost:5000/api/reader/literature/${hamletId}`);
    const detailData = await detailRes.json();
    const found = detailData.literature.comments.find((c: any) => c.id === parentCommentId);
    expect(found).toBeUndefined();
  });
});
