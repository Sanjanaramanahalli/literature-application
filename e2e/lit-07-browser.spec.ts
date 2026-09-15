import { test, expect } from '@playwright/test';

test.describe('Milestone 3 - LIT-07: Saved Literature (Personal Reading List)', () => {
  const timestamp = Date.now();
  const readerEmail = `collector_${timestamp}@literature.org`;
  const readerPassword = 'ReaderPassword123!';

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page.locator('#main-header')).toBeVisible({ timeout: 15000 });
  });

  test('Guard / Negative: Anonymous visitor clicking Save to Sanctuary in Reader View is prompted to sign in', async ({ page }) => {
    // Open the first literature work
    const card = page.locator('[data-testid="literature-card"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();

    // Verify Reader View
    await expect(page.locator('#reader-view-container')).toBeVisible({ timeout: 10000 });

    // Click Save button anonymously
    const saveBtn = page.locator('#btn-toggle-save-reader');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Verify AuthModal is displayed
    const authModal = page.locator('#auth-modal');
    await expect(authModal).toBeVisible({ timeout: 5000 });
    await expect(authModal.locator('.modal-title')).toContainText('Enter the Sanctuary');
  });

  test('Positive: Authenticated reader saves manuscript; appears in personal "Saved Works" tab with full details', async ({ page }) => {
    // 1. Register new reader
    const registerBtn = page.locator('#btn-open-register');
    await expect(registerBtn).toBeVisible({ timeout: 10000 });
    await registerBtn.click();

    await page.fill('#reg-name', 'Curator Scholar');
    await page.fill('#reg-email', readerEmail);
    await page.fill('#reg-password', readerPassword);
    await page.fill('#reg-confirm', readerPassword);
    await page.click('#btn-submit-register');

    await expect(page.locator('#active-user-banner')).toBeVisible({ timeout: 10000 });

    // 2. Open first card and record title
    const card = page.locator('[data-testid="literature-card"]').first();
    await expect(card).toBeVisible();
    const savedTitle = await card.locator('.card-title').innerText();
    await card.click();

    await expect(page.locator('#reader-view-container')).toBeVisible({ timeout: 10000 });

    // 3. Click Save button in Reader View
    const saveBtn = page.locator('#btn-toggle-save-reader');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Verify button state changes to 'Saved in Sanctuary'
    await expect(saveBtn).toContainText('Saved in Sanctuary');

    // 4. Navigate to "Saved Works" in header
    const navSaved = page.locator('#nav-saved');
    await expect(navSaved).toBeVisible();
    await navSaved.click();

    // 5. Verify Saved Works view shows the manuscript
    const savedView = page.locator('#saved-works-view');
    await expect(savedView).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#saved-count-badge')).toContainText('1 Manuscript Saved');

    const savedCard = page.locator('[data-testid="saved-card"]').first();
    await expect(savedCard).toBeVisible();
    await expect(savedCard.locator('.saved-card-title')).toHaveText(savedTitle);
  });

  test('Positive: Reader can remove work from "Saved Works" and view clean empty state', async ({ page }) => {
    const uniqueEmail = `remover_${Date.now()}@literature.org`;

    // 1. Register fresh reader
    const registerBtn = page.locator('#btn-open-register');
    await expect(registerBtn).toBeVisible({ timeout: 10000 });
    await registerBtn.click();

    await page.fill('#reg-name', 'Remover Scholar');
    await page.fill('#reg-email', uniqueEmail);
    await page.fill('#reg-password', 'ScholarPassword123!');
    await page.fill('#reg-confirm', 'ScholarPassword123!');
    await page.click('#btn-submit-register');

    await expect(page.locator('#active-user-banner')).toBeVisible({ timeout: 10000 });

    // 2. Open first card and save it
    const card = page.locator('[data-testid="literature-card"]').first();
    await expect(card).toBeVisible();
    await card.click();

    await expect(page.locator('#reader-view-container')).toBeVisible({ timeout: 10000 });
    const saveBtn = page.locator('#btn-toggle-save-reader');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();
    await expect(saveBtn).toContainText('Saved in Sanctuary');

    // 3. Navigate to Saved Works
    const navSaved = page.locator('#nav-saved');
    await expect(navSaved).toBeVisible();
    await navSaved.click();

    await expect(page.locator('#saved-works-view')).toBeVisible({ timeout: 10000 });

    // 4. Remove manuscript
    const removeBtn = page.locator('.btn-unsave').first();
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();

    // 5. Verify clean empty state appears with explore button
    const emptyState = page.locator('#saved-empty-state');
    await expect(emptyState).toBeVisible({ timeout: 10000 });
    await expect(emptyState.locator('.saved-empty-title')).toHaveText('Your Reading Shelf is Empty');

    const exploreBtn = page.locator('#btn-explore-from-saved');
    await expect(exploreBtn).toBeVisible();
    await exploreBtn.click();

    // 6. Verify returned to Catalog view
    await expect(page.locator('#catalog-view')).toBeVisible({ timeout: 10000 });
  });
});
