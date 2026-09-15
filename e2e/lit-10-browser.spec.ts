import { test, expect } from '@playwright/test';

test.describe('Sprint 10 - LIT-10: Real-Time Admin Dashboard with 8 Live KPI Cards Browser Suite', () => {
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

  test('Access Control: Non-admin users cannot see or access the KPI Dashboard', async ({ page }) => {
    // 1. Check as anonymous visitor
    await expect(page.locator('#nav-admin')).toHaveCount(0);

    // 2. Check as authenticated regular Reader
    await page.click('#btn-open-login');
    await expect(page.locator('#auth-modal')).toBeVisible({ timeout: 5000 });
    await page.fill('#login-email', readerEmail);
    await page.fill('#login-password', readerPassword);
    await page.click('#btn-submit-login');

    await expect(page.locator('#active-user-banner')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#active-user-banner')).toContainText('READER');
    await expect(page.locator('#nav-admin')).toHaveCount(0);
  });

  test('Live KPI Accuracy: Admin opens Live Dashboard and all 8 KPI cards display accurate non-NaN metrics', async ({ page }) => {
    // 1. Log in as Admin
    await page.click('#btn-open-login');
    await expect(page.locator('#auth-modal')).toBeVisible({ timeout: 5000 });
    await page.fill('#login-email', adminEmail);
    await page.fill('#login-password', adminPassword);
    await page.click('#btn-submit-login');

    await expect(page.locator('#active-user-banner')).toBeVisible({ timeout: 10000 });

    // 2. Navigate to Admin Dashboard
    await page.click('#nav-admin');
    await expect(page.locator('#admin-editorial-view')).toBeVisible({ timeout: 10000 });

    // 3. Switch to Live Dashboard Tab
    const analyticsTab = page.locator('#tab-btn-executive-analytics');
    await expect(analyticsTab).toBeVisible({ timeout: 5000 });
    await analyticsTab.click();

    await expect(page.locator('#executive-kpi-dashboard-view')).toBeVisible({ timeout: 10000 });

    // 4. Verify all 8 KPI cards are rendered
    const kpiTotalLit = page.locator('#kpi-val-total-literature');
    const kpiPubLit = page.locator('#kpi-val-published-literature');
    const kpiDraftLit = page.locator('#kpi-val-draft-literature');
    const kpiReaders = page.locator('#kpi-val-registered-readers');
    const kpiRatings = page.locator('#kpi-val-total-ratings');
    const kpiAvgRating = page.locator('#kpi-val-average-rating');
    const kpiComments = page.locator('#kpi-val-total-comments');
    const kpiSaves = page.locator('#kpi-val-total-saves');

    await expect(kpiTotalLit).toBeVisible();
    await expect(kpiPubLit).toBeVisible();
    await expect(kpiDraftLit).toBeVisible();
    await expect(kpiReaders).toBeVisible();
    await expect(kpiRatings).toBeVisible();
    await expect(kpiAvgRating).toBeVisible();
    await expect(kpiComments).toBeVisible();
    await expect(kpiSaves).toBeVisible();

    // Verify values are valid non-NaN numbers
    const totalLitVal = parseInt(await kpiTotalLit.innerText(), 10);
    const pubLitVal = parseInt(await kpiPubLit.innerText(), 10);
    const draftLitVal = parseInt(await kpiDraftLit.innerText(), 10);
    const readersVal = parseInt(await kpiReaders.innerText(), 10);
    const ratingsVal = parseInt(await kpiRatings.innerText(), 10);
    const avgRatingVal = parseFloat(await kpiAvgRating.innerText());
    const commentsVal = parseInt(await kpiComments.innerText(), 10);
    const savesVal = parseInt(await kpiSaves.innerText(), 10);

    expect(Number.isInteger(totalLitVal)).toBe(true);
    expect(Number.isInteger(pubLitVal)).toBe(true);
    expect(Number.isInteger(draftLitVal)).toBe(true);
    expect(Number.isInteger(readersVal)).toBe(true);
    expect(Number.isInteger(ratingsVal)).toBe(true);
    expect(!isNaN(avgRatingVal)).toBe(true);
    expect(Number.isInteger(commentsVal)).toBe(true);
    expect(Number.isInteger(savesVal)).toBe(true);

    // Acceptance criteria: Total Literature = Published + Drafts (or greater if unpublished)
    expect(totalLitVal).toBeGreaterThanOrEqual(pubLitVal + draftLitVal);

    // Acceptance criteria: Readers strictly excludes Admins (registeredReaders >= 2)
    expect(readersVal).toBeGreaterThanOrEqual(2);

    // Acceptance criteria: Average rating between 0.0 and 5.0 without NaN
    expect(avgRatingVal).toBeGreaterThanOrEqual(0.0);
    expect(avgRatingVal).toBeLessThanOrEqual(5.0);

    // 5. Verify Secondary Analytics Panels
    await expect(page.locator('#panel-recent-comments')).toBeVisible();
    await expect(page.locator('#panel-recent-literature')).toBeVisible();

    // 6. Test Refresh Button interaction
    const refreshBtn = page.locator('#btn-refresh-kpis');
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
    await expect(kpiTotalLit).toBeVisible();
  });

  test('Real-Time Live State: Adding a new draft manuscript increments Total Literature & Draft Literature KPI counts', async ({ page }) => {
    // 1. Log in as Admin
    await page.click('#btn-open-login');
    await expect(page.locator('#auth-modal')).toBeVisible({ timeout: 5000 });
    await page.fill('#login-email', adminEmail);
    await page.fill('#login-password', adminPassword);
    await page.click('#btn-submit-login');

    await expect(page.locator('#active-user-banner')).toBeVisible({ timeout: 10000 });

    // 2. Navigate to Live Dashboard & record current KPIs
    await page.click('#nav-admin');
    await page.click('#tab-btn-executive-analytics');
    await expect(page.locator('#executive-kpi-dashboard-view')).toBeVisible({ timeout: 10000 });

    const initialTotal = parseInt(await page.locator('#kpi-val-total-literature').innerText(), 10);
    const initialDrafts = parseInt(await page.locator('#kpi-val-draft-literature').innerText(), 10);

    // 3. Switch to Create Manuscript and save a draft
    await page.click('#tab-btn-create-manuscript');
    await expect(page.locator('#form-create-manuscript')).toBeVisible({ timeout: 5000 });

    const uniqueDraft = `Live Telemetry Verification Work #${Date.now()}`;
    await page.fill('#lit-title', uniqueDraft);
    await page.fill('#lit-brief', 'Brief philosophical note verifying live KPI update telemetry.');
    await page.fill('#lit-content', 'Contemplation on the flow of metrics and immutable records.');
    await page.click('#btn-save-draft');

    await expect(page.locator('#editorial-alert-success')).toBeVisible({ timeout: 10000 });

    // 4. Return to Live Dashboard and refresh metrics
    await page.click('#tab-btn-executive-analytics');
    await page.click('#btn-refresh-kpis');

    // 5. Verify increment by exactly 1
    await expect(page.locator('#kpi-val-total-literature')).toHaveText(String(initialTotal + 1));
    await expect(page.locator('#kpi-val-draft-literature')).toHaveText(String(initialDrafts + 1));
  });
});
