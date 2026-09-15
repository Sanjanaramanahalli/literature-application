import { test, expect } from '@playwright/test';

test.describe('Milestone 5 - LIT-11: Full End-to-End User Journey Regression Suite', () => {
  test('Complete Visitor Journey: Browse, Explore, Advanced Search and Read', async ({ page }) => {
    // 1. Visit Home Page
    await page.goto('/');
    await expect(page.locator('.brand-title')).toHaveText('ATHENÆUM');

    // 2. Query Search API directly as visitor
    const searchRes = await page.request.get('http://localhost:5000/api/search/advanced?author=Shakespeare');
    expect(searchRes.status()).toBe(200);
    const searchData = await searchRes.json();
    expect(searchData.total).toBeGreaterThanOrEqual(1);

    // 3. Read Literature Detail
    const hamletId = searchData.results[0].id;
    const detailRes = await page.request.get(`http://localhost:5000/api/reader/literature/${hamletId}`);
    expect(detailRes.status()).toBe(200);
    const detailData = await detailRes.json();
    expect(detailData.literature.title).toContain('Hamlet');
    expect(detailData.literature.content).toContain('To be, or not to be');
  });

  test('Complete Reader Journey: Login, 1-5 Star Rating, Save, and Threaded Comments', async ({ page }) => {
    // 1. Reader Authentication
    const loginRes = await page.request.post('http://localhost:5000/api/auth/login', {
      data: { email: 'julian@literature.org', password: 'ReaderPassword123!' },
    });
    expect(loginRes.status()).toBe(200);
    const { token } = await loginRes.json();

    // 2. Fetch Catalog
    const catRes = await page.request.get('http://localhost:5000/api/literature');
    const { literatures } = await catRes.json();
    const tolstoyWork = literatures.find((l: any) => l.title.includes('Ivan Ilyich'));

    // 3. Submit Rating
    const rateRes = await page.request.post(`http://localhost:5000/api/reader/literature/${tolstoyWork.id}/ratings`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { value: 5 },
    });
    expect(rateRes.status()).toBe(200);

    // 4. Save Literature
    const saveRes = await page.request.post(`http://localhost:5000/api/reader/literature/${tolstoyWork.id}/save`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(saveRes.status()).toBe(200);

    // 5. Post Discussion Comment & Reply
    const commentRes = await page.request.post(`http://localhost:5000/api/reader/literature/${tolstoyWork.id}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { content: 'Profoundly moving exploration of the human condition.' },
    });
    expect(commentRes.status()).toBe(201);
    const { comment } = await commentRes.json();

    const replyRes = await page.request.post(`http://localhost:5000/api/reader/literature/${tolstoyWork.id}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { content: 'Agreed, particularly the courtroom juxtaposition.', parentId: comment.id },
    });
    expect(replyRes.status()).toBe(201);

    // Cleanup: cascade delete parent comment
    await page.request.delete(`http://localhost:5000/api/reader/comments/${comment.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  });

  test('Complete Admin Journey: Protected Route Verification & 8 Live KPIs', async ({ page }) => {
    // 1. Admin Login
    const adminLogin = await page.request.post('http://localhost:5000/api/auth/login', {
      data: { email: 'admin@literature.org', password: 'AdminPassword123!' },
    });
    const { token: adminToken } = await adminLogin.json();

    // 2. Fetch Live KPIs
    const kpiRes = await page.request.get('http://localhost:5000/api/admin/dashboard/kpis', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(kpiRes.status()).toBe(200);
    const { kpis } = await kpiRes.json();

    // Validate all 8 KPI cards
    expect(kpis.totalLiterature).toBeGreaterThanOrEqual(3);
    expect(kpis.publishedLiterature).toBeGreaterThanOrEqual(3);
    expect(kpis.draftLiterature).toBeGreaterThanOrEqual(0);
    expect(kpis.registeredReaders).toBeGreaterThanOrEqual(2);
    expect(kpis.totalRatings).toBeGreaterThanOrEqual(3);
    expect(kpis.averageRating).toBeGreaterThanOrEqual(1.0);
    expect(kpis.totalComments).toBeGreaterThanOrEqual(1);
    expect(kpis.totalSaves).toBeGreaterThanOrEqual(1);

    // 3. Security Boundary: Reader access to Admin KPIs is rejected
    const readerLogin = await page.request.post('http://localhost:5000/api/auth/login', {
      data: { email: 'julian@literature.org', password: 'ReaderPassword123!' },
    });
    const { token: readerToken } = await readerLogin.json();

    const unauthorizedRes = await page.request.get('http://localhost:5000/api/admin/dashboard/kpis', {
      headers: { Authorization: `Bearer ${readerToken}` },
    });
    expect(unauthorizedRes.status()).toBe(403);
  });
});
