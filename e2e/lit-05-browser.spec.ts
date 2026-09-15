import { test, expect } from '@playwright/test';

test.describe('Milestone 2 - LIT-05: Advanced Multi-Field Search & Filter Engine (Browser UI)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    // Navigate to Search tab
    const searchNavBtn = page.locator('#nav-search');
    await expect(searchNavBtn).toBeVisible({ timeout: 10000 });
    await searchNavBtn.click();
    await expect(page.locator('#advanced-search-view')).toBeVisible({ timeout: 10000 });
  });

  test('Positive: Multi-criteria combination search by Author="Shakespeare" and Category="Drama" returns Hamlet', async ({ page }) => {
    // Fill Author
    const authorInput = page.locator('#search-input-author');
    await expect(authorInput).toBeVisible();
    await authorInput.fill('Shakespeare');

    // Select Drama category
    const categorySelect = page.locator('#search-select-category');
    await expect(categorySelect).toBeVisible();
    await categorySelect.selectOption({ label: 'Drama' });

    // Submit search
    await page.click('#btn-submit-search');

    // Verify Results Grid
    const resultsGrid = page.locator('#search-results-grid');
    await expect(resultsGrid).toBeVisible();

    const cards = resultsGrid.locator('[data-testid="literature-card"]');
    await expect(cards).toHaveCount(1);
    await expect(cards.first().locator('.card-title')).toContainText('Hamlet');
    await expect(cards.first().locator('.author-name')).toContainText('Shakespeare');
  });

  test('Positive: Search by Subject="Mortality" returns Ivan Ilyich', async ({ page }) => {
    const subjectInput = page.locator('#search-input-subject');
    await expect(subjectInput).toBeVisible();
    await subjectInput.fill('Mortality');

    await page.click('#btn-submit-search');

    const resultsGrid = page.locator('#search-results-grid');
    await expect(resultsGrid).toBeVisible();

    const cards = resultsGrid.locator('[data-testid="literature-card"]');
    await expect(cards).toHaveCount(1);
    await expect(cards.first().locator('.card-title')).toContainText('Ivan Ilyich');
  });

  test('Positive: Search by Tag="Modernism" returns Virginia Woolf', async ({ page }) => {
    const tagInput = page.locator('#search-input-tag');
    await expect(tagInput).toBeVisible();
    await tagInput.fill('Modernism');

    await page.click('#btn-submit-search');

    const resultsGrid = page.locator('#search-results-grid');
    await expect(resultsGrid).toBeVisible();

    const cards = resultsGrid.locator('[data-testid="literature-card"]');
    await expect(cards).toHaveCount(1);
    await expect(cards.first().locator('.author-name')).toContainText('Virginia Woolf');
  });

  test('Negative: Non-existent search combination displays graceful empty state with reset button', async ({ page }) => {
    const titleInput = page.locator('#search-input-title');
    await titleInput.fill('NonExistentManuscriptTitle12345');

    await page.click('#btn-submit-search');

    // Verify graceful empty state
    const emptyState = page.locator('#empty-search-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState.locator('.empty-title')).toHaveText('No Works Found');

    // Click Reset Filters
    const resetBtn = page.locator('#btn-empty-reset');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // Results should recover
    const resultsGrid = page.locator('#search-results-grid');
    await expect(resultsGrid).toBeVisible();
    const count = await resultsGrid.locator('[data-testid="literature-card"]').count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('Positive: Quick-suggest prompt chips auto-populate fields and execute search', async ({ page }) => {
    const chip = page.locator('#chip-shakespeare-drama');
    await expect(chip).toBeVisible();
    await chip.click();

    // Verify fields populated
    await expect(page.locator('#search-input-author')).toHaveValue('Shakespeare');
    await expect(page.locator('#search-select-category')).toHaveValue('Drama');

    // Verify results show Hamlet
    const resultsGrid = page.locator('#search-results-grid');
    await expect(resultsGrid).toBeVisible();
    await expect(resultsGrid.locator('.card-title')).toContainText('Hamlet');
  });
});
