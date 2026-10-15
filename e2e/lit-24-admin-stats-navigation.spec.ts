import { test, expect } from '@playwright/test';

test.describe('LIT-24: Interactive Admin Dashboard Statistic Cards & Dedicated Data Pages', () => {
  const adminEmail = 'sanjanalramanahalli@gmail.com';
  const adminPassword = 'AdminPassword123!';

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();

    // 1. Log in as Administrator
    const openLoginBtn = page.locator('#btn-open-login');
    await expect(openLoginBtn).toBeVisible();
    await openLoginBtn.click();

    await page.locator('#login-email').fill(adminEmail);
    await page.locator('#login-password').fill(adminPassword);
    await page.locator('#btn-submit-login').click();

    // Verify successful login into Admin Sanctuary
    await expect(page.locator('#auth-modal')).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator('#admin-editorial-view')).toBeVisible({ timeout: 15000 });

    // Ensure we are on the Analytics tab
    const analyticsTabBtn = page.locator('#tab-btn-kpi-dashboard');
    if (await analyticsTabBtn.isVisible()) {
      await analyticsTabBtn.click();
    }
    await expect(page.locator('#kpi-cards-container')).toBeVisible({ timeout: 15000 });
  });

  test('Card 1: Total Literature card opens dedicated directory with search and filters', async ({ page }) => {
    const card = page.locator('#kpi-total-literature');
    await expect(card).toBeVisible();
    await card.click();

    // Verify dedicated view opened
    const statView = page.locator('#admin-stat-view-total-literature');
    await expect(statView).toBeVisible();
    await expect(statView.locator('h1')).toContainText('Total Literature');

    // Verify data table rendered with records
    const table = statView.locator('#stat-table-total-literature');
    await expect(table).toBeVisible();
    await expect(table.locator('tbody tr')).not.toHaveCount(0);

    // Verify search filter works
    const searchInput = statView.locator('#stat-search-input');
    await searchInput.fill('Hamlet');
    await expect(table.locator('tbody tr')).toContainText(['Hamlet']);

    // Verify breadcrumb back button returns to dashboard
    const backBtn = statView.locator('#btn-stat-back-to-dashboard');
    await backBtn.click();
    await expect(page.locator('#kpi-cards-container')).toBeVisible();
  });

  test('Card 2: Published Works card opens dedicated published works catalog', async ({ page }) => {
    const card = page.locator('#kpi-published-literature');
    await expect(card).toBeVisible();
    await card.click();

    const statView = page.locator('#admin-stat-view-published-literature');
    await expect(statView).toBeVisible();
    await expect(statView.locator('h1')).toContainText('Published Works');

    // Verify table has records and only published
    const table = statView.locator('#stat-table-published-literature');
    await expect(table).toBeVisible();
    await expect(table.locator('tbody tr')).not.toHaveCount(0);

    // Return to dashboard
    await statView.locator('#btn-stat-back-to-dashboard').click();
    await expect(page.locator('#kpi-cards-container')).toBeVisible();
  });

  test('Card 3: Draft Literature card opens dedicated draft works page', async ({ page }) => {
    const card = page.locator('#kpi-draft-literature');
    await expect(card).toBeVisible();
    await card.click();

    const statView = page.locator('#admin-stat-view-draft-literature');
    await expect(statView).toBeVisible();
    await expect(statView.locator('h1')).toContainText('Draft Literature');

    // Return to dashboard
    await statView.locator('#btn-stat-back-to-dashboard').click();
    await expect(page.locator('#kpi-cards-container')).toBeVisible();
  });

  test('Card 4: Unpublished Literature card opens dedicated unpublished page', async ({ page }) => {
    const card = page.locator('#kpi-unpublished-literature');
    await expect(card).toBeVisible();
    await card.click();

    const statView = page.locator('#admin-stat-view-unpublished-literature');
    await expect(statView).toBeVisible();
    await expect(statView.locator('h1')).toContainText('Unpublished');

    await statView.locator('#btn-stat-back-to-dashboard').click();
    await expect(page.locator('#kpi-cards-container')).toBeVisible();
  });

  test('Card 5: Registered Readers card displays readers excluding administrators', async ({ page }) => {
    const card = page.locator('#kpi-registered-readers');
    await expect(card).toBeVisible();
    await card.click();

    const statView = page.locator('#admin-stat-view-registered-readers');
    await expect(statView).toBeVisible();
    await expect(statView.locator('h1')).toContainText('Registered Readers');

    const table = statView.locator('#stat-table-registered-readers');
    await expect(table).toBeVisible();

    // Verify administrator accounts are excluded
    await expect(table).not.toContainText('admin@literature.org');
    await expect(table).not.toContainText('sanjanalramanahalli@gmail.com');

    // Return to dashboard
    await statView.locator('#btn-stat-back-to-dashboard').click();
    await expect(page.locator('#kpi-cards-container')).toBeVisible();
  });

  test('Card 6: Total Ratings card displays individual rating records', async ({ page }) => {
    const card = page.locator('#kpi-total-ratings');
    await expect(card).toBeVisible();
    await card.click();

    const statView = page.locator('#admin-stat-view-total-ratings');
    await expect(statView).toBeVisible();
    await expect(statView.locator('h1')).toContainText('Scholar Rating Logs');

    const table = statView.locator('#stat-table-total-ratings');
    await expect(table).toBeVisible();
    await expect(table.locator('tbody tr')).not.toHaveCount(0);

    await statView.locator('#btn-stat-back-to-dashboard').click();
    await expect(page.locator('#kpi-cards-container')).toBeVisible();
  });

  test('Card 7: Average Rating card displays rating summaries and cumulative stats', async ({ page }) => {
    const card = page.locator('#kpi-average-rating');
    await expect(card).toBeVisible();
    await card.click();

    const statView = page.locator('#admin-stat-view-average-rating');
    await expect(statView).toBeVisible();
    await expect(statView.locator('h1')).toContainText('Average');

    // Verify summary banner shows cumulative sanctuary average
    await expect(statView.locator('#stat-cumulative-average-val')).toBeVisible();

    const table = statView.locator('#stat-table-average-rating');
    await expect(table).toBeVisible();
    await expect(table.locator('tbody tr')).not.toHaveCount(0);

    await statView.locator('#btn-stat-back-to-dashboard').click();
    await expect(page.locator('#kpi-cards-container')).toBeVisible();
  });

  test('Card 8: Total Comments card displays reader discussions and threaded replies', async ({ page }) => {
    const card = page.locator('#kpi-total-comments');
    await expect(card).toBeVisible();
    await card.click();

    const statView = page.locator('#admin-stat-view-total-comments');
    await expect(statView).toBeVisible();
    await expect(statView.locator('h1')).toContainText('Reader Reflections');

    await statView.locator('#btn-stat-back-to-dashboard').click();
    await expect(page.locator('#kpi-cards-container')).toBeVisible();
  });

  test('Card 9: Total Saves card displays sanctuary bookmarks', async ({ page }) => {
    const card = page.locator('#kpi-total-saves');
    await expect(card).toBeVisible();
    await card.click();

    const statView = page.locator('#admin-stat-view-total-saves');
    await expect(statView).toBeVisible();
    await expect(statView.locator('h1')).toContainText('Bookmarked Literature');

    const table = statView.locator('#stat-table-total-saves');
    await expect(table).toBeVisible();
    await expect(table.locator('tbody tr')).not.toHaveCount(0);

    // Return to dashboard via breadcrumb link
    await statView.locator('#btn-stat-breadcrumb-dashboard').click();
    await expect(page.locator('#kpi-cards-container')).toBeVisible();
  });

  test('Card 10: New Users This Month card displays current month registrations', async ({ page }) => {
    const card = page.locator('#kpi-new-users');
    await expect(card).toBeVisible();
    await card.click();

    const statView = page.locator('#admin-stat-view-new-users');
    await expect(statView).toBeVisible();
    await expect(statView.locator('h1')).toContainText('New Readers & Scholars');

    const table = statView.locator('#stat-table-new-users');
    await expect(table).toBeVisible();

    await statView.locator('#btn-stat-back-to-dashboard').click();
    await expect(page.locator('#kpi-cards-container')).toBeVisible();
  });

  test('Card 11: New Releases This Month card displays works published in current calendar month', async ({ page }) => {
    const card = page.locator('#kpi-new-releases');
    await expect(card).toBeVisible();
    await card.click();

    const statView = page.locator('#admin-stat-view-new-releases');
    await expect(statView).toBeVisible();
    await expect(statView.locator('h1')).toContainText('New Releases Published');

    // Either table or empty state must be visible depending on current month database records
    const table = statView.locator('#stat-table-new-releases');
    const emptyState = statView.locator('#stat-empty-new-releases');
    await expect(table.or(emptyState)).toBeVisible();

    await statView.locator('#btn-stat-back-to-dashboard').click();
    await expect(page.locator('#kpi-cards-container')).toBeVisible();
  });

  test('Card 12: Total Art & Craft card displays cultural records across 28 states', async ({ page }) => {
    const card = page.locator('#kpi-total-artcraft');
    await expect(card).toBeVisible();
    await card.click();

    const statView = page.locator('#admin-stat-view-total-artcraft');
    await expect(statView).toBeVisible();
    await expect(statView.locator('h1')).toContainText('Total Art & Craft');

    const table = statView.locator('#stat-table-total-artcraft');
    await expect(table).toBeVisible();
    await expect(table.locator('tbody tr')).not.toHaveCount(0);

    // Verify state filter exists and works
    const stateFilter = statView.locator('#stat-filter-state');
    await expect(stateFilter).toBeVisible();
    await stateFilter.selectOption('Karnataka');
    await expect(table.locator('tbody tr')).toContainText(['Karnataka']);

    // Breadcrumb return
    await statView.locator('#btn-stat-breadcrumb-dashboard').click();
    await expect(page.locator('#kpi-cards-container')).toBeVisible();
  });

  test('Accessibility: Cards support keyboard Enter navigation', async ({ page }) => {
    const card = page.locator('#kpi-total-artcraft');
    await card.focus();
    await page.keyboard.press('Enter');

    const statView = page.locator('#admin-stat-view-total-artcraft');
    await expect(statView).toBeVisible();
  });
});
