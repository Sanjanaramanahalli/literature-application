import { test, expect } from '@playwright/test';

test.describe('Milestone 3 - LIT-06: Reader Detail Page & 1-5 Star Dynamic Rating System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await expect(page.locator('#catalog-view')).toBeVisible({ timeout: 15000 });
  });

  test('Positive: Selecting a work navigates to distraction-free Reader View with complete literary folio', async ({ page }) => {
    // Wait for catalog cards
    const card = page.locator('[data-testid="literature-card"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });

    const cardTitle = await card.locator('.card-title').innerText();

    // Click card to enter reader view
    await card.click();

    // Verify Reader Sanctuary Article is visible
    const readerContainer = page.locator('#reader-view-container');
    await expect(readerContainer).toBeVisible({ timeout: 10000 });

    const readerTitle = page.locator('#reader-title');
    await expect(readerTitle).toHaveText(cardTitle);

    // Verify paragraphs, category badge, and author attribution
    await expect(page.locator('#reader-body-paragraphs')).toBeVisible();
    await expect(page.locator('#reader-author-name')).toBeVisible();
    await expect(page.locator('#interactive-stars-widget')).toBeVisible();

    // Verify return to catalog button works seamlessly
    await page.click('#btn-reader-back');
    await expect(page.locator('#catalog-view')).toBeVisible({ timeout: 10000 });
  });

  test('Guard / Negative: Anonymous visitor clicking star is intercepted with Auth modal prompt', async ({ page }) => {
    // Select first card
    const card = page.locator('[data-testid="literature-card"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();

    await expect(page.locator('#reader-view-container')).toBeVisible({ timeout: 10000 });

    // Click 5th star anonymously
    const star5 = page.locator('#star-btn-5');
    await expect(star5).toBeVisible();
    await star5.click();

    // Verify Auth Modal is prompted
    const authModal = page.locator('#auth-modal');
    await expect(authModal).toBeVisible({ timeout: 5000 });
    await expect(authModal.locator('.modal-title')).toContainText('Enter the Sanctuary');
  });

  test('Positive: Authenticated reader submits 5 stars, dynamic average rating and count update', async ({ page }) => {
    // Register unique reader session
    const timestamp = Date.now();
    const uniqueEmail = `scholar_${timestamp}@example.com`;

    const registerBtn = page.locator('#btn-open-register');
    await expect(registerBtn).toBeVisible({ timeout: 10000 });
    await registerBtn.click();

    await page.fill('#reg-name', 'Aristotle Scholar');
    await page.fill('#reg-email', uniqueEmail);
    await page.fill('#reg-password', 'ScholarPassword123!');
    await page.fill('#reg-confirm', 'ScholarPassword123!');
    await page.click('#btn-submit-register');

    // Verify authenticated session
    await expect(page.locator('#active-user-banner')).toBeVisible({ timeout: 10000 });

    // Navigate to Hamlet / first literature card
    const card = page.locator('[data-testid="literature-card"]').first();
    await expect(card).toBeVisible();
    await card.click();

    await expect(page.locator('#reader-view-container')).toBeVisible({ timeout: 10000 });

    // Capture initial ratings count and average
    const countLocator = page.locator('#display-ratings-count');
    const initialCount = parseInt((await countLocator.innerText()).trim(), 10) || 0;

    // Click 5 Stars
    await page.click('#star-btn-5');

    // Verify feedback message
    const feedbackMsg = page.locator('#rating-feedback-message');
    await expect(feedbackMsg).toBeVisible({ timeout: 5000 });
    await expect(feedbackMsg).toContainText('5-star rating was recorded');

    // Verify total evaluations incremented by 1
    await expect(page.locator('#display-ratings-count')).toHaveText(String(initialCount + 1));
    await expect(page.locator('#display-user-rating')).toHaveText('5 ★');
  });

  test('Positive: Reader changes rating from 5 to 3 stars; total count remains single active while average dynamically updates', async ({ page }) => {
    // Register unique reader session
    const timestamp = Date.now();
    const uniqueEmail = `reviewer_${timestamp}@example.com`;

    const registerBtn = page.locator('#btn-open-register');
    await expect(registerBtn).toBeVisible({ timeout: 10000 });
    await registerBtn.click();

    await page.fill('#reg-name', 'Plato Reviewer');
    await page.fill('#reg-email', uniqueEmail);
    await page.fill('#reg-password', 'ScholarPassword123!');
    await page.fill('#reg-confirm', 'ScholarPassword123!');
    await page.click('#btn-submit-register');

    await expect(page.locator('#active-user-banner')).toBeVisible({ timeout: 10000 });

    // Open work
    const card = page.locator('[data-testid="literature-card"]').first();
    await card.click();
    await expect(page.locator('#reader-view-container')).toBeVisible({ timeout: 10000 });

    // First rating: 5 stars
    await page.click('#star-btn-5');
    await expect(page.locator('#rating-feedback-message')).toContainText('5-star rating was recorded');
    const countAfterFirstRating = parseInt((await page.locator('#display-ratings-count').innerText()).trim(), 10);

    // Update rating: 3 stars
    await page.click('#star-btn-3');
    await expect(page.locator('#rating-feedback-message')).toContainText('3-star rating was recorded');

    // Verify count did not increment again (Single active rating per reader per work!)
    const countAfterUpdate = parseInt((await page.locator('#display-ratings-count').innerText()).trim(), 10);
    expect(countAfterUpdate).toBe(countAfterFirstRating);

    // Verify user rating badge updated to 3 stars
    await expect(page.locator('#display-user-rating')).toHaveText('3 ★');
  });
});
