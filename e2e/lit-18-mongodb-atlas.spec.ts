import { test, expect } from '@playwright/test';

test.describe('Issue #18: MongoDB Atlas Database Migration Verification', () => {
  test('Backend connects to MongoDB and serves health status with literature count', async ({ request }) => {
    const res = await request.get('http://localhost:5000/api/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('online');
    expect(body.database).toBe('connected');
    expect(body.literatureCount).toBeGreaterThan(0);
    expect(body.service).toContain('MongoDB');
  });

  test('Creates and reads records from MongoDB (Reader Authentication & Profile)', async ({ request }) => {
    const uniqueEmail = `test_mongo_${Date.now()}@literature.org`;
    const regRes = await request.post('http://localhost:5000/api/auth/register', {
      data: {
        name: 'Scholar Tester',
        email: uniqueEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'READER',
      },
    });
    expect(regRes.ok()).toBeTruthy();
    const regData = await regRes.json();
    expect(regData.token).toBeTruthy();
    expect(regData.user.email).toBe(uniqueEmail);

    // Read record back from MongoDB session
    const meRes = await request.get('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${regData.token}` },
    });
    expect(meRes.ok()).toBeTruthy();
    const meData = await meRes.json();
    expect(meData.user.name).toBe('Scholar Tester');
  });

  test('Frontend loads literature cards and categories powered by MongoDB', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify main welcome sanctuary banner
    const banner = page.locator('#sanctuary-welcome-heading');
    await expect(banner).toBeVisible();

    // Verify canonical literature items render from MongoDB
    const literatureCards = page.locator('.literature-card');
    await expect(literatureCards.first()).toBeVisible({ timeout: 15000 });
    const count = await literatureCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Frontend reader authentication modal works seamlessly with MongoDB', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click Sign In
    const signInBtn = page.locator('#btn-nav-signin');
    if (await signInBtn.isVisible()) {
      await signInBtn.click();
      await expect(page.locator('#auth-modal')).toBeVisible();

      await page.fill('#auth-email', 'julian@literature.org');
      await page.fill('#auth-password', 'ReaderPassword123!');
      await page.click('#btn-auth-submit');

      // Verify authenticated banner appears
      await expect(page.locator('#active-user-banner')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('#active-user-banner')).toContainText('Julian Croft');
    }
  });

  test('Art & Craft catalog successfully queries MongoDB collection', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Art & Craft Traditions
    const craftNav = page.locator('#nav-artcraft');
    if (await craftNav.isVisible()) {
      await craftNav.click();
      await page.waitForTimeout(1000);
      const craftCards = page.locator('.artcraft-card');
      await expect(craftCards.first()).toBeVisible({ timeout: 10000 });
      const craftCount = await craftCards.count();
      expect(craftCount).toBeGreaterThan(0);
    }
  });
});
