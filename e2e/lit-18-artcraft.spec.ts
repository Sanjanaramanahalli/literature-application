import { test, expect } from '@playwright/test';

test.describe('Indian Art & Craft Section & Heritage Management Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  // =========================================================================
  // 1. Navigation & Catalog View
  // =========================================================================
  test('1.1 Header contains Art & Craft navigation item and opens catalog', async ({ page }) => {
    const artCraftNav = page.locator('#nav-artcraft');
    await expect(artCraftNav).toBeVisible();
    await artCraftNav.click();

    // Section title and banner verification
    await expect(page.locator('#artcraft-section-title')).toBeVisible();
    await expect(page.locator('#artcraft-section-title')).toHaveText('Indian Art & Cultural Heritage');

    // State filter bar
    const statesBar = page.locator('#states-filter-bar');
    await expect(statesBar).toBeVisible();
    await expect(page.locator('#chip-state-all')).toBeVisible();

    // Craft cards are displayed
    const craftCards = page.locator('[data-testid="artcraft-card"]');
    await expect(craftCards.first()).toBeVisible();
    const count = await craftCards.count();
    expect(count).toBeGreaterThanOrEqual(28);
  });

  // =========================================================================
  // 2. State-Wise Filter & Region Verification
  // =========================================================================
  test('2.1 Filtering by Karnataka displays Channapatna Toys with verified regional details', async ({ page }) => {
    await page.locator('#nav-artcraft').click();

    // Click Karnataka state chip
    const karnatakaChip = page.locator('#chip-state-karnataka');
    await expect(karnatakaChip).toBeVisible();
    await karnatakaChip.click();

    // Verify Channapatna Toys is visible
    const channapatnaCard = page.locator('text=Channapatna Toys');
    await expect(channapatnaCard).toBeVisible();

    // Verify Local script (Kannada / Hindi) rendering
    const kannadaTitle = page.locator('text=ಚನ್ನಪಟ್ಟಣದ ಗೊಂಬೆಗಳು');
    await expect(kannadaTitle).toBeVisible();
  });

  test('2.2 Filtering by Rajasthan displays Jaipur Blue Pottery and Molela Terracotta', async ({ page }) => {
    await page.locator('#nav-artcraft').click();

    // Click Rajasthan state chip
    const rajasthanChip = page.locator('#chip-state-rajasthan');
    await expect(rajasthanChip).toBeVisible();
    await rajasthanChip.click();

    await expect(page.locator('text=Jaipur Blue Pottery')).toBeVisible();
    await expect(page.locator('text=Molela Terracotta Plaques')).toBeVisible();
  });

  // =========================================================================
  // 3. Craft Detail View
  // =========================================================================
  test('3.1 Clicking Channapatna Toys opens detailed cultural heritage view', async ({ page }) => {
    await page.locator('#nav-artcraft').click();
    await page.locator('#chip-state-karnataka').click();

    // Click on Channapatna Toys card
    await page.locator('text=Channapatna Toys').click();

    // Verify Detail view is displayed
    await expect(page.locator('#artcraft-detail-view')).toBeVisible();
    await expect(page.locator('#craft-detail-title')).toHaveText('Channapatna Toys');
    await expect(page.locator('#craft-detail-local-name')).toContainText('ಚನ್ನಪಟ್ಟಣದ ಗೊಂಬೆಗಳು');

    // Verify historical and process sections
    await expect(page.locator('#craft-origin-callout')).toBeVisible();
    await expect(page.locator('#craft-section-history')).toBeVisible();
    await expect(page.locator('#craft-section-culture')).toBeVisible();
    await expect(page.locator('#craft-section-materials')).toBeVisible();
    await expect(page.locator('#craft-section-making-process')).toBeVisible();
    await expect(page.locator('#craft-box-products')).toBeVisible();
    await expect(page.locator('#craft-box-modern')).toBeVisible();

    // Verify back navigation returns to catalog
    await page.locator('#btn-back-to-crafts').click();
    await expect(page.locator('#artcraft-catalog-view')).toBeVisible();
  });

  // =========================================================================
  // 4. Advanced Search Integration
  // =========================================================================
  test('4.1 Search view supports searching Indian Art & Craft by place (e.g. Channapatna)', async ({ page }) => {
    await page.locator('#nav-search').click();
    await expect(page.locator('#advanced-search-view')).toBeVisible();

    // Switch to Indian Art & Craft search
    const craftSearchTab = page.locator('#tab-search-artcraft');
    await expect(craftSearchTab).toBeVisible();
    await craftSearchTab.click();

    // Type "Channapatna" in place or craft name
    const placeInput = page.locator('#search-input-place');
    await placeInput.fill('Channapatna');
    await page.locator('#btn-submit-craft-search').click();

    // Result should show Channapatna Toys
    await expect(page.locator('#search-craft-results-grid')).toBeVisible();
    await expect(page.locator('text=Channapatna Toys')).toBeVisible();
  });

  // =========================================================================
  // 5. Admin Dashboard 12th KPI Card Verification
  // =========================================================================
  test('5.1 Admin Dashboard displays Total Art & Craft KPI card alongside existing 11 cards', async ({ page }) => {
    // Sign in as admin
    await page.goto('http://localhost:5173');
    await page.locator('#nav-admin-signin').click();
    await page.locator('#admin-email').fill('admin@literature.org');
    await page.locator('#admin-password').fill('AdminPassword123!');
    await page.locator('#btn-submit-admin-signin').click();

    // Verify Admin Dashboard is visible
    await expect(page.locator('#admin-editorial-view')).toBeVisible();

    // Verify the existing 11 KPI cards
    await expect(page.locator('#kpi-total-literature')).toBeVisible();
    await expect(page.locator('#kpi-published-literature')).toBeVisible();
    await expect(page.locator('#kpi-new-releases')).toBeVisible();

    // Verify the new 12th KPI card: Total Art & Craft
    const craftKpi = page.locator('#kpi-total-artcraft');
    await expect(craftKpi).toBeVisible();
    const craftKpiVal = page.locator('#kpi-val-total-artcraft');
    await expect(craftKpiVal).toBeVisible();
    const countText = await craftKpiVal.innerText();
    expect(parseInt(countText, 10)).toBeGreaterThanOrEqual(28);

    // Verify Art & Craft Studio tab is available in Admin Editorial View
    const studioTab = page.locator('#tab-btn-artcraft-studio');
    await expect(studioTab).toBeVisible();
    await studioTab.click();

    // Verify Art & Craft Admin registry table
    await expect(page.locator('#admin-crafts-table')).toBeVisible();
    await expect(page.locator('#craft-form-name')).toBeVisible();
  });
});
