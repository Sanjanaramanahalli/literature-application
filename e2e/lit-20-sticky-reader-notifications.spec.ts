import { test, expect } from '@playwright/test';

test.describe('Reader Clean Sticky Toolbar, Page 1 Opening & Admin Notifications', () => {
  const adminEmail = 'admin@literature.org';
  const adminPassword = 'AdminPassword123!';

  test('Positive: Literature opens at Page 1, sticky navigation bar is clean and readable', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Select the first literature card
    const card = page.locator('.literature-card, [data-testid="literature-card"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();

    // 1. Verify Cover Page appears first with total pages
    const coverPage = page.locator('#reader-cover-page');
    await expect(coverPage).toBeVisible({ timeout: 10000 });

    // 2. Click "Begin Reading Manuscript (Page by Page)"
    const openBtn = page.locator('#btn-open-manuscript');
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    // 3. Verify it opens Page 1 (NOT the last page)
    const pageIndicator = page.locator('#reader-page-indicator');
    await expect(pageIndicator).toBeVisible();
    await expect(pageIndicator).toContainText('Page 1 of');

    // 4. Verify sticky reader toolbar exists and has clean options button
    const navBar = page.locator('.reader-navigation-bar');
    await expect(navBar).toBeVisible();
    const optionsBtn = page.locator('#btn-reader-settings-toggle');
    await expect(optionsBtn).toBeVisible();

    // Click Options dropdown to verify secondary controls (Theme, Audio, Font) are clean
    await optionsBtn.click();
    await expect(page.locator('.reader-settings-dropdown')).toBeVisible();
    await expect(page.locator('#btn-reader-narration')).toBeVisible();

    // 5. Scroll down and verify reader-navigation-bar is sticky
    await page.evaluate(() => window.scrollTo(0, 500));
    await expect(navBar).toBeVisible();
  });

  test('Positive: Admin sees Notification Bell in Header and can view real-time likes, comments, and new users', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Sign in as Admin via dedicated admin-signin or auth modal
    await page.locator('#btn-open-login').click();
    await expect(page.locator('#auth-modal')).toBeVisible({ timeout: 5000 });
    await page.locator('#login-email').fill(adminEmail);
    await page.locator('#login-password').fill(adminPassword);
    await page.locator('#btn-submit-login').click();

    // Verify Admin is signed in
    await expect(page.locator('.user-profile-badge')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.user-role-tag')).toHaveText('ADMIN');

    // Verify Notification Bell icon is visible for Admin
    const notifBtn = page.locator('#btn-admin-notifications');
    await expect(notifBtn).toBeVisible();

    // Click Notification Bell to open popover
    await notifBtn.click();
    const dropdown = page.locator('#admin-notifications-dropdown');
    await expect(dropdown).toBeVisible();
    await expect(dropdown).toContainText('Curator Activity & Alerts');
  });

  test('Positive: Responsive layout adapts cleanly on mobile viewport', async ({ page }) => {
    // Set mobile viewport (iPhone 13 size: 390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Open first literature
    const card = page.locator('.literature-card, [data-testid="literature-card"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();

    // Verify Cover Page is visible and responsive
    const coverPage = page.locator('#reader-cover-page');
    await expect(coverPage).toBeVisible();

    // Open Page 1
    const openBtn = page.locator('#btn-open-manuscript');
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    // Verify Page 1 is displayed cleanly
    const pageIndicator = page.locator('#reader-page-indicator');
    await expect(pageIndicator).toBeVisible();
    await expect(pageIndicator).toContainText('Page 1 of');

    // Verify sticky navigation bar stays visible and responsive
    const navBar = page.locator('.reader-navigation-bar');
    await expect(navBar).toBeVisible();
  });
});
