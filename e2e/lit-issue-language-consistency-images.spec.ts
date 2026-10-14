import { test, expect } from '@playwright/test';

test.describe('Sprint - Literature Language Consistency, Warm Ivory Background, Unique Illustrations, and Catalog Expansion', () => {
  test('Verify 40+ works in catalog', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    const catalogCards = page.locator('.literature-card');
    await expect(catalogCards.first()).toBeVisible({ timeout: 12000 });

    const totalCards = await catalogCards.count();
    console.log('Total catalog literature cards displayed: ' + totalCards);
    expect(totalCards).toBeGreaterThanOrEqual(40);
  });

  test('Verify single language purity and warm ivory background in Reader', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('.literature-card');
    await expect(cards.first()).toBeVisible({ timeout: 12000 });
    
    const hindiCard = page.locator('.literature-card').filter({ hasText: /Hindi|गोदान|कामायनी|मधुशाला/i }).first();
    if (await hindiCard.count() > 0) {
      await hindiCard.click();
    } else {
      await cards.first().click();
    }

    const openBtn = page.locator('#btn-open-manuscript');
    await expect(openBtn).toBeVisible({ timeout: 8000 });
    await openBtn.click();

    const sheet = page.locator('#a4-page-sheet');
    await expect(sheet).toBeVisible({ timeout: 8000 });
    await expect(sheet).toHaveClass(/theme-ivory/);

    const bodyText = await sheet.innerText();
    expect(bodyText).not.toContain('In the silence of the archival chamber');
    expect(bodyText).not.toContain('The scholar meditates upon');

    const folio1Illustration = page.locator('[data-testid=literature-illustration]');
    await expect(folio1Illustration).toBeVisible();

    const nextBtn = page.locator('#btn-next-page');
    if (await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForTimeout(400);

      const folio2IllustrationCount = await page.locator('[data-testid=literature-illustration]').count();
      expect(folio2IllustrationCount).toBe(0);
    }
  });
});
