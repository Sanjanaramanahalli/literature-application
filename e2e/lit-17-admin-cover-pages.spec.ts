import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Sprint 17 / Issue #17: Dedicated Admin Sign-In, Mandatory Cover Page & Minimum >13-Page Literature Content Requirement', () => {
  const adminEmail = 'admin@literature.org';
  const adminPassword = 'AdminPassword123!';
  const readerEmail = 'julian@literature.org';
  const readerPassword = 'ReaderPassword123!';

  // Prepare a test cover image fixture
  const fixturesDir = path.join(__dirname, 'fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }
  const testCoverPath = path.join(fixturesDir, 'sprint17-test-cover.png');
  if (!fs.existsSync(testCoverPath)) {
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(testCoverPath, pngBuffer);
  }

  // Generate valid >13 pages content helper
  const generateLongContent = (numPages: number): string => {
    const pages: string[] = [];
    for (let p = 1; p <= numPages; p++) {
      pages.push(`[ Folio Page ${p} ]\nThis is canonical paragraph text on folio page ${p} of the classical manuscript. It explores ancient themes of truth, virtue, and literature.`);
    }
    return pages.join('\n\n---page---\n\n');
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  // =========================================================================
  // POSITIVE TEST CASES — BLUEPRINT
  // =========================================================================

  test('Positive #3: Dedicated Admin Sign-In: Open Admin Sign-In -> Enter valid Admin credentials -> Authenticated and redirected to Admin Dashboard', async ({ page }) => {
    // 1. Click dedicated Admin Sign-In link in header
    const adminSignInNav = page.locator('#nav-admin-signin');
    await expect(adminSignInNav).toBeVisible();
    await adminSignInNav.click();

    // 2. Verify dedicated Admin Sign-In page is rendered
    await expect(page.locator('#admin-signin-page')).toBeVisible();
    await expect(page.locator('#admin-signin-title')).toContainText('Administrator Sign-In');

    // 3. Enter valid Admin credentials
    await page.fill('#admin-email', adminEmail);
    await page.fill('#admin-password', adminPassword);

    // Verify password visibility toggle
    await page.click('#btn-toggle-admin-password');
    await expect(page.locator('#admin-password')).toHaveAttribute('type', 'text');
    await page.click('#btn-toggle-admin-password');
    await expect(page.locator('#admin-password')).toHaveAttribute('type', 'password');

    // 4. Click Sign In
    await page.click('#btn-submit-admin-signin');

    // 5. Admin is authenticated and redirected to Admin Dashboard
    await expect(page.locator('#admin-editorial-view')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#editorial-studio-heading')).toBeVisible();
    await expect(page.locator('#active-user-banner')).toContainText('ADMIN');
  });

  test('Positive #1 & #2: Admin creates literature with cover page & >13 pages -> successfully saved/published', async ({ page }) => {
    // 1. Sign in via dedicated Admin Sign-In page
    await page.click('#nav-admin-signin');
    await page.fill('#admin-email', adminEmail);
    await page.fill('#admin-password', adminPassword);
    await page.click('#btn-submit-admin-signin');
    await expect(page.locator('#admin-editorial-view')).toBeVisible({ timeout: 10000 });

    // 2. Open Create Manuscript
    await page.click('#tab-btn-create-manuscript');
    const timestamp = Date.now();
    const literatureTitle = `The Republic of Letters (Vol. ${timestamp})`;

    await page.fill('#lit-title', literatureTitle);
    await page.fill('#lit-brief', 'A complete philosophical treatise on human wisdom, virtue, and knowledge.');

    // Upload Cover Page
    const fileInput = page.locator('#file-input-cover');
    await fileInput.setInputFiles(testCoverPath);
    await expect(page.locator('#cover-preview-container')).toBeVisible({ timeout: 5000 });

    // Enter content exceeding 13 pages (15 pages)
    const longContent = generateLongContent(15);
    await page.fill('#lit-content', longContent);

    // Verify page counter badge reflects 15 pages and requirement met
    const pageBadge = page.locator('#badge-content-page-count');
    await expect(pageBadge).toBeVisible();
    await expect(pageBadge).toContainText('15 Pages');
    await expect(page.locator('#content-page-requirement-hint')).toContainText('Manuscript content verified');

    // 3. Publish Immediately
    await page.click('#btn-publish-now');

    // Expected Outcome: Literature is successfully published
    await expect(page.locator('#editorial-alert-success')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#editorial-alert-success')).toContainText('saved successfully as PUBLISHED');

    // Verify in Archival Registry
    await page.click('#tab-btn-manage-works');
    const workRow = page.locator('tr', { hasText: literatureTitle });
    await expect(workRow).toBeVisible();
    await expect(workRow.locator('.status-badge.published')).toBeVisible();
  });

  test('Positive #4: View published literature: Reader opens published literature -> Cover page appears first, followed by literature content', async ({ page }) => {
    // Navigate to Explore
    await page.click('#nav-explore');
    await expect(page.locator('#catalog-view')).toBeVisible({ timeout: 10000 });

    // Click on Hamlet
    const hamletCard = page.locator('.literature-card').filter({ hasText: 'Hamlet' }).first();
    await expect(hamletCard).toBeVisible();
    await hamletCard.click();

    // 1. Cover Page appears FIRST
    const coverPage = page.locator('#reader-cover-page');
    await expect(coverPage).toBeVisible({ timeout: 10000 });
    await expect(coverPage.locator('#cover-page-title')).toContainText('Hamlet, Prince of Denmark');
    await expect(coverPage.locator('#reader-cover-image')).toBeVisible();
    await expect(coverPage.locator('#cover-page-total-pages')).toBeVisible();
    await expect(coverPage.locator('#cover-page-total-pages')).toContainText('Pages');

    // Verify literature content paragraphs are NOT yet displayed before clicking Begin Reading
    await expect(page.locator('#reader-article-content')).toHaveCount(0);

    // 2. Reader clicks "Begin Reading Manuscript"
    const openBtn = page.locator('#btn-open-manuscript');
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    // 3. Literature content starts, with pagination controls
    await expect(page.locator('#reader-article-content')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#reader-page-indicator')).toBeVisible();
    await expect(page.locator('#reader-page-indicator')).toContainText('Page 1 of');

    // 4. Reader navigates to next page
    await page.click('#btn-next-page');
    await expect(page.locator('#reader-page-indicator')).toContainText('Page 2 of');

    // 5. Reader can return to Cover Page via top action button
    const returnCoverBtn = page.locator('#btn-return-cover-page');
    await expect(returnCoverBtn).toBeVisible();
    await returnCoverBtn.click();
    await expect(page.locator('#reader-cover-page')).toBeVisible();
  });

  // =========================================================================
  // NEGATIVE TEST CASES
  // =========================================================================

  test('Negative #1: Literature without cover page: System requires a cover page before publishing', async ({ page }) => {
    // Sign in as Admin
    await page.click('#nav-admin-signin');
    await page.fill('#admin-email', adminEmail);
    await page.fill('#admin-password', adminPassword);
    await page.click('#btn-submit-admin-signin');

    await page.click('#tab-btn-create-manuscript');
    const title = `No Cover Page Novel (${Date.now()})`;
    await page.fill('#lit-title', title);
    await page.fill('#lit-brief', 'Brief without cover');
    await page.fill('#lit-content', generateLongContent(15)); // Meets page requirement but lacks cover

    // Click Publish Immediately WITHOUT uploading cover
    await page.click('#btn-publish-now');

    // Expected Outcome: System requires cover page and blocks publishing
    await expect(page.locator('#editorial-alert-error')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#editorial-alert-error')).toContainText('dedicated Cover Page is required before literature can be published');
  });

  test('Positive #3: Literature with any page length (e.g. 2 pages): Admin publishes and work is saved persistently', async ({ page }) => {
    // Sign in as Admin
    await page.click('#nav-admin-signin');
    await page.fill('#admin-email', adminEmail);
    await page.fill('#admin-password', adminPassword);
    await page.click('#btn-submit-admin-signin');
    await expect(page.locator('#admin-editorial-view')).toBeVisible({ timeout: 10000 });

    await page.click('#tab-btn-create-manuscript');
    const title = `Short Work Test (${Date.now()})`;
    await page.fill('#lit-title', title);
    await page.fill('#lit-brief', 'Brief description');

    // Upload cover so cover requirement is satisfied
    const fileInput = page.locator('#file-input-cover');
    await fileInput.setInputFiles(testCoverPath);

    // Provide short content (2 pages)
    await page.fill('#lit-content', generateLongContent(2));

    // Page badge shows count without 13-page gate
    const pageBadge = page.locator('#badge-content-page-count');
    await expect(pageBadge).toContainText('2 Pages');
    await expect(page.locator('#content-page-requirement-hint')).toContainText('Manuscript content verified');

    // Click Publish Immediately
    await page.click('#btn-publish-now');

    // Expected Outcome: Work is successfully published and saved
    await expect(page.locator('#editorial-alert-success')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#editorial-alert-success')).toContainText('published');
  });

  test('Negative #3: Invalid Admin credentials: System rejects login and displays an appropriate error', async ({ page }) => {
    await page.click('#nav-admin-signin');
    await expect(page.locator('#admin-signin-page')).toBeVisible();

    await page.fill('#admin-email', adminEmail);
    await page.fill('#admin-password', 'CompletelyWrongPassword999!');
    await page.click('#btn-submit-admin-signin');

    // Expected Outcome: System rejects login and displays error
    const errorAlert = page.locator('#admin-signin-error');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
    await expect(errorAlert).toContainText('Invalid admin credentials');
  });

  test('Negative #4: Reader attempts Admin Sign-In: System denies Admin access', async ({ page }) => {
    await page.click('#nav-admin-signin');
    await expect(page.locator('#admin-signin-page')).toBeVisible();

    // Enter valid credentials of a READER account
    await page.fill('#admin-email', readerEmail);
    await page.fill('#admin-password', readerPassword);
    await page.click('#btn-submit-admin-signin');

    // Expected Outcome: System denies Admin access
    const errorAlert = page.locator('#admin-signin-error');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
    await expect(errorAlert).toContainText('Reader accounts are not authorized');
  });

  test('Negative #5: Visitor attempts Admin Dashboard: System redirects/denies access with Authenticate as Administrator', async ({ page }) => {
    // Visitor has no session. Attempting to click admin or reaching guard
    // Header doesn't render admin nav link for unauthenticated visitor, only Admin Sign-In
    await expect(page.locator('#nav-admin')).toHaveCount(0);
    await expect(page.locator('#nav-admin-signin')).toBeVisible();

    // Direct visit to admin sign-in works
    await page.click('#nav-admin-signin');
    await expect(page.locator('#admin-signin-page')).toBeVisible();
  });

  test('Negative #6: Empty literature content: System prevents publishing and requests valid content', async ({ page }) => {
    // Sign in as Admin
    await page.click('#nav-admin-signin');
    await page.fill('#admin-email', adminEmail);
    await page.fill('#admin-password', adminPassword);
    await page.click('#btn-submit-admin-signin');

    await page.click('#tab-btn-create-manuscript');
    await page.fill('#lit-title', `Empty Content Test (${Date.now()})`);
    await page.fill('#lit-brief', 'A brief note without content.');

    // Upload cover
    const fileInput = page.locator('#file-input-cover');
    await fileInput.setInputFiles(testCoverPath);

    // Leave lit-content empty
    await page.fill('#lit-content', '');

    // Click Publish Immediately
    await page.click('#btn-publish-now');

    // Expected Outcome: System prevents publishing
    await expect(page.locator('#editorial-alert-error')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#editorial-alert-error')).toContainText('Content before submitting');
  });
});
