import { test, expect } from '@playwright/test';

test.describe('Milestones 4 - LIT-09 & LIT-10: Admin Governance, Publishing & 8 Live KPI Cards', () => {
  let adminToken: string;
  let readerToken: string;
  let creatorId: string;
  let categoryId: string;
  let createdLitId: string;

  test.beforeAll(async ({ request }) => {
    // 1. Admin login
    const adminRes = await request.post('http://localhost:5000/api/auth/login', {
      data: { email: 'admin@literature.org', password: 'AdminPassword123!' },
    });
    const adminData = await adminRes.json();
    adminToken = adminData.token;

    // 2. Reader login
    const readerRes = await request.post('http://localhost:5000/api/auth/login', {
      data: { email: 'julian@literature.org', password: 'ReaderPassword123!' },
    });
    const readerData = await readerRes.json();
    readerToken = readerData.token;

    // 3. Get creator and category
    const catRes = await request.get('http://localhost:5000/api/literature/categories');
    const catData = await catRes.json();
    categoryId = catData.categories[0].id;

    const litRes = await request.get('http://localhost:5000/api/literature');
    const litData = await litRes.json();
    creatorId = litData.literatures[0].creator.id;
  });

  // --- LIT-09: Literature Creation & Lifecycle ---
  test('LIT-09: Admin can create literature as DRAFT and then publish it', async ({ request }) => {
    // 1. Create Draft
    const createRes = await request.post('http://localhost:5000/api/admin/literature', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        title: 'Faust (Part I & II Archival)',
        subheading: 'A Tragedy of Knowledge and Diabolical Pact',
        brief: 'Goethe’s magnum opus exploring the limits of scholastic knowledge.',
        content: 'PROLOGUE IN HEAVEN. The LORD. The HEAVENLY HOSTS. Afterwards MEPHISTOPHELES.',
        creatorId,
        categoryId,
        publicationStatus: 'DRAFT',
      },
    });
    expect(createRes.status()).toBe(201);
    const createData = await createRes.json();
    createdLitId = createData.literature.id;
    expect(createData.literature.publicationStatus).toBe('DRAFT');

    // 2. Publish it
    const updateRes = await request.put(`http://localhost:5000/api/admin/literature/${createdLitId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { publicationStatus: 'PUBLISHED' },
    });
    expect(updateRes.status()).toBe(200);
    const updateData = await updateRes.json();
    expect(updateData.literature.publicationStatus).toBe('PUBLISHED');
  });

  test('Negative: Reader cannot access Admin literature creation', async ({ request }) => {
    const res = await request.post('http://localhost:5000/api/admin/literature', {
      headers: { Authorization: `Bearer ${readerToken}` },
      data: { title: 'Unauthorized Work' },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Access denied');
  });

  // --- LIT-10: 8 Live KPI Cards & Secondary Analytics ---
  test('LIT-10: Admin Dashboard KPI endpoint accurately delivers all 8 required metrics', async ({ request }) => {
    const res = await request.get('http://localhost:5000/api/admin/dashboard/kpis', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();

    // Verify presence and numeric types of all 8 KPI cards
    const { kpis } = body;
    expect(typeof kpis.totalLiterature).toBe('number');
    expect(typeof kpis.publishedLiterature).toBe('number');
    expect(typeof kpis.draftLiterature).toBe('number');
    expect(typeof kpis.registeredReaders).toBe('number');
    expect(typeof kpis.totalRatings).toBe('number');
    expect(typeof kpis.averageRating).toBe('number');
    expect(typeof kpis.totalComments).toBe('number');
    expect(typeof kpis.totalSaves).toBe('number');

    // Registered readers must exclude Admin accounts
    expect(kpis.registeredReaders).toBeGreaterThanOrEqual(2);
    // Average rating must be non-zero and formatted
    expect(kpis.averageRating).toBeGreaterThanOrEqual(1.0);
    expect(kpis.averageRating).toBeLessThanOrEqual(5.0);

    // Secondary analytics
    expect(Array.isArray(body.recentComments)).toBe(true);
    expect(Array.isArray(body.recentLiterature)).toBe(true);
  });
});
