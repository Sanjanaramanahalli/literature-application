import { test, expect } from '@playwright/test';

test.describe('Sprint - Literature Page A4 Size Sheet and Embedded Illustrations', () => {
  test('Literature page renders as A4 size sheet and includes related illustrations', async ({ page }) => {
    // 1. Navigate to Catalog
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Verify catalog has items loaded
    const catalogCards = page.locator('.literature-card');
    await expect(catalogCards.first()).toBeVisible({ timeout: 10000 });

    // 2. Select Hamlet Prince of Denmark or first literature card
    const hamletCard = page.locator('.literature-card').filter({ hasText: /Hamlet/i });
    if (await hamletCard.count() > 0) {
      await hamletCard.first().click();
    } else {
      await catalogCards.first().click();
    }

    // 3. Verify Dedicated Cover Page is displayed first
    const coverPage = page.locator('#reader-cover-page');
    await expect(coverPage).toBeVisible({ timeout: 8000 });

    // 4. Click 'Begin Reading Manuscript (Page by Page)'
    const openManuscriptBtn = page.locator('#btn-open-manuscript');
    await expect(openManuscriptBtn).toBeVisible();
    await openManuscriptBtn.click();

    // 5. Verify A4 Page Sheet exists and has proper styling
    const a4PageSheet = page.locator('#a4-page-sheet');
    await expect(a4PageSheet).toBeVisible({ timeout: 8000 });

    // Verify it contains the A4 classes
    await expect(a4PageSheet).toHaveClass(/a4-page-sheet/);

    // Verify A4 bounding dimensions (max-width around 794px, height substantial)
    const box = await a4PageSheet.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      // In desktop view, width should be near 794px (within standard layout padding)
      expect(box.width).toBeGreaterThanOrEqual(600);
      expect(box.width).toBeLessThanOrEqual(805);
      // Min height should be substantial like a true folio page
      expect(box.height).toBeGreaterThan(600);
    }

    // 6. Verify related picture / illustration is embedded inside the literature page
    const illustration = page.locator('[data-testid="literature-illustration"]').first();
    await expect(illustration).toBeVisible();

    const illustrationImg = illustration.locator('img');
    await expect(illustrationImg).toBeVisible();
    const imgSrc = await illustrationImg.getAttribute('src');
    expect(imgSrc).toBeTruthy();

    const caption = illustration.locator('.illustration-caption-text');
    await expect(caption).toBeVisible();
    const captionText = await caption.textContent();
    expect(captionText && captionText.length > 5).toBeTruthy();

    // 7. Verify Page Footer indicates A4 Folio
    const footerIndicator = page.locator('.folio-footer-indicator');
    await expect(footerIndicator).toBeVisible();
    await expect(footerIndicator).toContainText(/A4 Folio/i);

    // 8. Test Navigation to Page 2 (if available)
    const nextBtn = page.locator('#btn-next-page');
    if (await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForTimeout(400);

      // Verify Page 2 also has A4 sheet structure
      await expect(a4PageSheet).toBeVisible();
      const pageIndicator = page.locator('#reader-page-indicator');
      await expect(pageIndicator).toContainText(/Page 2/i);
    }

    // 9. Switch to Full Literature View and verify A4 sheets there as well
    const toggleDisplayBtn = page.locator('#btn-toggle-display-mode');
    await toggleDisplayBtn.click();
    await page.waitForTimeout(400);

    const fullFolios = page.locator('.a4-full-folio-sheet');
    await expect(fullFolios.first()).toBeVisible();
    const fullIllustration = fullFolios.first().locator('[data-testid="literature-illustration"]');
    await expect(fullIllustration).toBeVisible();
  });
});
