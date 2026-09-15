import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Sprint 9 - LIT-09: Literature Creation, Draft/Publish & Local Cover Upload Browser Suite', () => {
  const adminEmail = 'admin@literature.org';
  const adminPassword = 'AdminPassword123!';
  const readerEmail = 'julian@literature.org';
  const readerPassword = 'ReaderPassword123!';

  // Prepare a test cover image
  const fixturesDir = path.join(__dirname, 'fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }
  const testCoverPath = path.join(fixturesDir, 'test-cover.png');
  // Small 1x1 valid PNG buffer if not present
  if (!fs.existsSync(testCoverPath)) {
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(testCoverPath, pngBuffer);
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.locator('#main-header')).toBeVisible({ timeout: 15000 });
  });

  test('Security / RBAC Guard: Anonymous visitor cannot view editorial studio and sees authorization prompt', async ({ page }) => {
    // The Admin tab should not even appear in the nav for anonymous users
    await expect(page.locator('#nav-admin')).toHaveCount(0);
  });

  test('Security / RBAC Guard: Standard Reader role cannot access editorial studio', async ({ page }) => {
    // 1. Log in as regular Reader
    await page.click('#btn-open-login');
    await expect(page.locator('#auth-modal')).toBeVisible({ timeout: 5000 });
    await page.fill('#login-email', readerEmail);
    await page.fill('#login-password', readerPassword);
    await page.click('#btn-submit-login');

    await expect(page.locator('#active-user-banner')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#active-user-banner')).toContainText('READER');

    // Admin tab should NOT be rendered for regular Reader
    await expect(page.locator('#nav-admin')).toHaveCount(0);
  });

  test('Admin Flow: Login, Open Editorial Studio, Upload Cover, Save Manuscript as DRAFT, and verify it is not in public catalog', async ({ page }) => {
    const timestamp = Date.now();
    const draftTitle = `Metamorphoses (Archival Draft #${timestamp})`;

    // 1. Log in as Admin
    await page.click('#btn-open-login');
    await expect(page.locator('#auth-modal')).toBeVisible({ timeout: 5000 });
    await page.fill('#login-email', adminEmail);
    await page.fill('#login-password', adminPassword);
    await page.click('#btn-submit-login');

    await expect(page.locator('#active-user-banner')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#active-user-banner')).toContainText('ADMIN');

    // 2. Click Admin Dashboard Nav Link
    const adminNavBtn = page.locator('#nav-admin');
    await expect(adminNavBtn).toBeVisible({ timeout: 5000 });
    await adminNavBtn.click();

    // 3. Verify Editorial Studio is displayed
    await expect(page.locator('#admin-editorial-view')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#editorial-studio-heading')).toContainText('Curatorial Editorial Studio');

    // 4. Fill in Manuscript Creation Form
    await page.fill('#lit-title', draftTitle);
    await page.fill('#lit-subheading', 'The Transformations of Form and Myth');
    await page.fill('#lit-brief', 'A narrative poem in fifteen books describing the creation and history of the world.');
    await page.fill('#lit-content', 'Of bodies changed to other shapes I sing. Assist, you gods (for you have changed them too), my undertaking.');
    await page.fill('#lit-genre', 'Epic Poetry');
    await page.fill('#lit-subject', 'Mythology & Transformation');
    await page.fill('#lit-tags', 'Ovid, Latin, Roman Myth');

    // 5. Upload Cover File via file input
    const fileInput = page.locator('#file-input-cover');
    await fileInput.setInputFiles(testCoverPath);

    // Verify preview appears
    await expect(page.locator('#cover-preview-container')).toBeVisible({ timeout: 5000 });

    // 6. Click "Save as Draft"
    await page.click('#btn-save-draft');

    // Verify success banner appears
    await expect(page.locator('#editorial-alert-success')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#editorial-alert-success')).toContainText('saved successfully as DRAFT');

    // 7. Verify Draft appears in Archival Registry
    await page.click('#tab-btn-manage-works');
    await expect(page.locator('#archival-registry-view')).toBeVisible({ timeout: 5000 });

    // Filter to Drafts
    await page.click('#filter-pill-draft');
    await expect(page.locator('.work-title-text', { hasText: draftTitle })).toBeVisible({ timeout: 5000 });

    // 8. Verify Draft does NOT appear in Public Catalog / Explore
    await page.click('#nav-explore');
    await expect(page.locator('#catalog-view')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.card-title', { hasText: draftTitle })).toHaveCount(0);
  });

  test('Admin Flow: Promote DRAFT to PUBLISHED and verify it appears in Public Catalog, then UNPUBLISH it', async ({ page }) => {
    const timestamp = Date.now();
    const litTitle = `The Aeneid: Book VI (${timestamp})`;

    // 1. Log in as Admin
    await page.click('#btn-open-login');
    await expect(page.locator('#auth-modal')).toBeVisible({ timeout: 5000 });
    await page.fill('#login-email', adminEmail);
    await page.fill('#login-password', adminPassword);
    await page.click('#btn-submit-login');

    await expect(page.locator('#active-user-banner')).toBeVisible({ timeout: 10000 });

    // 2. Open Admin Editorial View
    await page.click('#nav-admin');
    await expect(page.locator('#admin-editorial-view')).toBeVisible({ timeout: 10000 });

    // 3. Create Draft
    await page.fill('#lit-title', litTitle);
    await page.fill('#lit-brief', 'Aeneas descends into the Underworld guided by the Cumaean Sibyl.');
    await page.fill('#lit-content', 'They went obscure, through the lonely night amid the gloom, through the empty homes of Dis.');
    await page.click('#btn-save-draft');
    await expect(page.locator('#editorial-alert-success')).toBeVisible({ timeout: 10000 });

    // 4. Go to Archival Registry
    await page.click('#tab-btn-manage-works');
    await expect(page.locator('#archival-registry-view')).toBeVisible({ timeout: 5000 });

    const workRow = page.locator('tr', { has: page.locator('.work-title-text', { hasText: litTitle }) });
    await expect(workRow).toBeVisible({ timeout: 5000 });

    // 5. Click "Publish" button on the draft row
    const publishBtn = workRow.locator('button:has-text("Publish")');
    await expect(publishBtn).toBeVisible();
    await publishBtn.click();

    // Verify success banner and status badge update
    await expect(page.locator('#editorial-alert-success')).toBeVisible({ timeout: 10000 });
    await expect(workRow.locator('.status-badge')).toContainText('PUBLISHED');

    // 6. Verify it now appears live in Public Explore
    await page.click('#nav-explore');
    await expect(page.locator('#catalog-view')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.card-title', { hasText: litTitle }).first()).toBeVisible({ timeout: 10000 });

    // 7. Return to Admin and UNPUBLISH the work
    await page.click('#nav-admin');
    await page.click('#tab-btn-manage-works');
    const publishedWorkRow = page.locator('tr', { has: page.locator('.work-title-text', { hasText: litTitle }) });
    await expect(publishedWorkRow).toBeVisible({ timeout: 5000 });

    const unpublishBtn = publishedWorkRow.locator('button:has-text("Unpublish")');
    await expect(unpublishBtn).toBeVisible();
    await unpublishBtn.click();

    await expect(page.locator('#editorial-alert-success')).toBeVisible({ timeout: 10000 });
    await expect(publishedWorkRow.locator('.status-badge')).toContainText('UNPUBLISHED');

    // 8. Verify it is now removed from Public Explore
    await page.click('#nav-explore');
    await expect(page.locator('#catalog-view')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.card-title', { hasText: litTitle })).toHaveCount(0);
  });
});
