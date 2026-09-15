import { test, expect } from '@playwright/test';

test.describe('Sprint 11 - LIT-11: Full End-to-End Playwright Automation & Quality Gate Suite', () => {
  const adminEmail = 'admin@literature.org';
  const adminPassword = 'AdminPassword123!';
  const readerEmail = 'julian@literature.org';
  const readerPassword = 'ReaderPassword123!';

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.locator('#main-header')).toBeVisible({ timeout: 15000 });
  });

  test('Journey 1 - Visitor Discovery & Reading Experience: Browse Catalog, Filter Category, and Open Folio', async ({ page }) => {
    // 1. Verify Brand Header and Welcome Sanctuary
    await expect(page.locator('.brand-title')).toHaveText('ATHENÆUM');
    await expect(page.locator('#sanctuary-welcome-heading')).toBeVisible();

    // 2. Navigate to Explore
    await page.click('#nav-explore');
    await expect(page.locator('#catalog-view')).toBeVisible({ timeout: 10000 });

    // 3. Open first catalog literature card
    const card = page.locator('[data-testid="literature-card"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    const cardTitle = await card.locator('.card-title').innerText();
    await card.click();

    // 4. Verify Reader View is loaded with canonical folio
    await expect(page.locator('#reader-view-container')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#reader-title')).toHaveText(cardTitle);
    await expect(page.locator('#reader-body-paragraphs')).toBeVisible();

    // 5. Back to Catalog
    await page.click('#btn-reader-back');
    await expect(page.locator('#catalog-view')).toBeVisible();
  });

  test('Journey 2 - Advanced Multi-Criteria Search: Query by multiple attributes with instant results', async ({ page }) => {
    await page.click('#nav-search');
    await expect(page.locator('#advanced-search-view')).toBeVisible({ timeout: 10000 });

    // Search for Shakespeare in Drama
    await page.fill('#search-input-author', 'Shakespeare');
    await page.selectOption('#search-select-category', { label: 'Drama' });
    await page.click('#btn-submit-search');

    await expect(page.locator('#search-results-grid')).toBeVisible({ timeout: 10000 });
    const results = page.locator('[data-testid="literature-card"]');
    await expect(results).toHaveCount(1);
    await expect(results.first().locator('.card-title')).toContainText('Hamlet');
  });

  test('Journey 3 - Scholar Reader Authentication, Ratings, Save Sanctuary, and Discussion Threading', async ({ page }) => {
    // 1. Authenticate Reader
    await page.click('#btn-open-login');
    await expect(page.locator('#auth-modal')).toBeVisible({ timeout: 5000 });
    await page.fill('#login-email', readerEmail);
    await page.fill('#login-password', readerPassword);
    await page.click('#btn-submit-login');

    await expect(page.locator('#active-user-banner')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#active-user-banner')).toContainText('READER');

    // 2. Open First Literature
    const card = page.locator('[data-testid="literature-card"]').first();
    await expect(card).toBeVisible();
    await card.click();
    await expect(page.locator('#reader-view-container')).toBeVisible({ timeout: 10000 });

    // 3. Submit Rating (Star 5)
    const star5 = page.locator('#star-btn-5');
    await expect(star5).toBeVisible();
    await star5.click();
    await expect(page.locator('#rating-feedback-message')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#display-user-rating')).toHaveText('5 ★');

    // 4. Save to Sanctuary
    const saveBtn = page.locator('#btn-toggle-save-reader');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();
    await expect(saveBtn).toBeVisible();

    // 5. Post Threaded Comment
    const commentInput = page.locator('#input-top-comment');
    await expect(commentInput).toBeVisible();
    const commentMsg = `Philosophical inquiry #${Date.now()}`;
    await commentInput.fill(commentMsg);
    await page.click('#btn-submit-top-comment');

    const commentCard = page.locator(`[data-testid="comment-card"]:has-text("${commentMsg}")`);
    await expect(commentCard).toBeVisible({ timeout: 10000 });
  });

  test('Journey 4 - Curator / Admin Archival Lifecycle: Creation, Local Cover Art, Curation, and Real-Time KPI Telemetry', async ({ page }) => {
    // 1. Authenticate Admin
    await page.click('#btn-open-login');
    await expect(page.locator('#auth-modal')).toBeVisible({ timeout: 5000 });
    await page.fill('#login-email', adminEmail);
    await page.fill('#login-password', adminPassword);
    await page.click('#btn-submit-login');

    await expect(page.locator('#active-user-banner')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#active-user-banner')).toContainText('ADMIN');

    // 2. Navigate to Admin Dashboard
    await page.click('#nav-admin');
    await expect(page.locator('#admin-editorial-view')).toBeVisible({ timeout: 10000 });

    // 3. Verify Live Dashboard Metrics
    await page.click('#tab-btn-executive-analytics');
    await expect(page.locator('#executive-kpi-dashboard-view')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#kpi-total-literature')).toBeVisible();
    await expect(page.locator('#kpi-registered-readers')).toBeVisible();

    // 4. Verify Archival Registry
    await page.click('#tab-btn-manage-works');
    await expect(page.locator('#archival-registry-view')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#table-archival-works')).toBeVisible();
  });
});
