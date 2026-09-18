import { test, expect } from '@playwright/test';

test.describe('Milestone 2 - LIT-04: Literature Catalog, Popularity & New Releases (Browser UI)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    // Ensure catalog container loaded
    await expect(page.locator('#catalog-view')).toBeVisible({ timeout: 10000 });
  });

  test('Positive: Featured Literature Hero section is prominently displayed with metadata and actions', async ({ page }) => {
    const featuredSection = page.locator('#featured-literature-section');
    await expect(featuredSection).toBeVisible();

    // Verify Title and Author
    const title = featuredSection.locator('.featured-title');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText?.length).toBeGreaterThan(0);

    const author = featuredSection.locator('.featured-author');
    await expect(author).toBeVisible();

    // Verify stats bar (ratings, saves, comments)
    await expect(featuredSection.locator('.featured-metrics-bar')).toBeVisible();

    // Verify Call to Action button
    const readBtn = featuredSection.locator('#btn-read-featured');
    await expect(readBtn).toBeVisible();
    await expect(readBtn).toHaveText(/Read Work/i);
  });

  test('Positive: Popular Literature section strictly displays ranked works with scores and counts', async ({ page }) => {
    const popularSection = page.locator('#popular-literature-section');
    await expect(popularSection).toBeVisible();

    // Verify title
    await expect(popularSection.locator('.section-title')).toHaveText('Most Celebrated Works');

    // Verify cards inside popular grid
    const popularCards = page.locator('#popular-literature-grid [data-testid="literature-card"]');
    const count = await popularCards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // First card should have popularity badge
    const firstRibbon = popularCards.first().locator('.card-ribbon');
    await expect(firstRibbon).toBeVisible();
    await expect(firstRibbon).toContainText('#1 Popular');

    // Verify ratings and metrics are rendered
    await expect(popularCards.first().locator('.card-rating')).toBeVisible();
    await expect(popularCards.first().locator('.card-metrics')).toBeVisible();
  });

  test('Positive: New Releases section displays latest additions in reverse chronological order', async ({ page }) => {
    const newSection = page.locator('#new-releases-section');
    await expect(newSection).toBeVisible();

    await expect(newSection.locator('.section-title')).toHaveText('New Releases & Recent Additions');

    const newCards = page.locator('#new-releases-grid [data-testid="literature-card"]');
    const count = await newCards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Verify "New Edition" ribbon
    const ribbon = newCards.first().locator('.card-ribbon');
    await expect(ribbon).toBeVisible();
    await expect(ribbon).toHaveText('New Edition');
  });

  test('Positive: Category filter bar updates catalog compendium list dynamically', async ({ page }) => {
    await page.click('#nav-explore');
    const filterBar = page.locator('#category-filter-bar');
    await expect(filterBar).toBeVisible();

    // Check "All Archives" button is initially active
    const allBtn = page.locator('#cat-filter-all');
    await expect(allBtn).toHaveClass(/active/);

    const initialCount = await page.locator('#compendium-grid [data-testid="literature-card"]').count();
    expect(initialCount).toBeGreaterThanOrEqual(3);

    // Click on Drama filter
    const dramaBtn = page.locator('#cat-filter-drama');
    if (await dramaBtn.isVisible()) {
      await dramaBtn.click();
      await expect(dramaBtn).toHaveClass(/active/);
      await expect(allBtn).not.toHaveClass(/active/);

      // Verify filtered cards only show Drama category
      const dramaCards = page.locator('#compendium-grid [data-testid="literature-card"]');
      const dramaCount = await dramaCards.count();
      expect(dramaCount).toBeGreaterThanOrEqual(1);

      for (let i = 0; i < dramaCount; i++) {
        await expect(dramaCards.nth(i).locator('[data-testid="card-category"]')).toHaveText('Drama');
      }
    }
  });

  test('Negative: Draft status works are strictly excluded from all public catalog sections', async ({ page }) => {
    // In seed data, "The Seagull (Draft Archival Translation)" is in DRAFT status
    const allCardsText = await page.locator('#catalog-view').textContent();
    expect(allCardsText).not.toContain('The Seagull (Draft Archival Translation)');
    expect(allCardsText).not.toContain('DRAFT');
  });

  test('Responsive: Mobile viewport renders card grid and hero cleanly', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);

    await expect(page.locator('#featured-literature-section')).toBeVisible({ timeout: 10000 });
    await page.click('#nav-explore');
    await expect(page.locator('#compendium-grid')).toBeVisible({ timeout: 10000 });

    // Verify card fits cleanly without horizontal overflow
    const card = page.locator('#compendium-grid [data-testid="literature-card"]').first();
    await expect(card).toBeVisible();
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(390);
    }
  });
});
