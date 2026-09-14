import { test, expect } from '@playwright/test';

test.describe('Milestone 1 - LIT-02: Interactive Browser Authentication & RBAC Suite', () => {
  const uniqueEmail = `browser_reader_${Date.now()}@literature.org`;

  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh visitor state
    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('Positive: Visitor opens Sign In modal, logs in with valid credentials, and sees user profile badge in header', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Click Sign In button in sticky header
    const signInBtn = page.locator('#btn-open-login');
    await expect(signInBtn).toBeVisible();
    await signInBtn.click();

    // Verify modal elements
    const modal = page.locator('#auth-modal');
    await expect(modal).toBeVisible();
    await expect(page.locator('.modal-title')).toHaveText('Enter the Sanctuary');

    // Fill login form
    await page.fill('#login-email', 'julian@literature.org');
    await page.fill('#login-password', 'ReaderPassword123!');
    await page.click('#btn-submit-login');

    // Modal closes and user badge displays in header
    await expect(modal).not.toBeVisible();
    await expect(page.locator('.user-name')).toHaveText('Julian Croft');
    await expect(page.locator('.user-role-tag')).toHaveText('READER');
    await expect(page.locator('#active-user-banner')).toBeVisible();
  });

  test('Negative: Visitor enters wrong password and receives inline error alert', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.click('#btn-open-login');

    await page.fill('#login-email', 'julian@literature.org');
    await page.fill('#login-password', 'WrongPassword123!');
    await page.click('#btn-submit-login');

    const errorAlert = page.locator('#auth-error-msg');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Invalid email or password');
  });

  test('Positive: Visitor switches to Create Account, registers new reader, and is immediately authenticated', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.click('#btn-open-register');

    const modal = page.locator('#auth-modal');
    await expect(modal).toBeVisible();
    await expect(page.locator('.modal-title')).toHaveText('Join the Athenæum');

    // Fill registration form
    await page.fill('#reg-name', 'Dorothea Brooke');
    await page.fill('#reg-email', uniqueEmail);
    await page.fill('#reg-password', 'Middlemarch123!');
    await page.fill('#reg-confirm', 'Middlemarch123!');
    await page.click('#btn-submit-register');

    // Modal closes and authenticated state rendered
    await expect(modal).not.toBeVisible();
    await expect(page.locator('.user-name')).toHaveText('Dorothea Brooke');
    await expect(page.locator('.user-role-tag')).toHaveText('READER');
  });

  test('Positive: Admin registration using Admin Secret Key awards ADMIN badge & shows Admin Dashboard nav link', async ({ page }) => {
    const adminEmail = `admin_scholar_${Date.now()}@literature.org`;
    await page.goto('http://localhost:5173');
    await page.click('#btn-open-register');

    await page.fill('#reg-name', 'Curator Hastings');
    await page.fill('#reg-email', adminEmail);
    await page.fill('#reg-password', 'AdminSecret123!');
    await page.fill('#reg-confirm', 'AdminSecret123!');

    // Toggle admin secret input
    await page.click('#toggle-admin-secret');
    const adminSecretInput = page.locator('#reg-admin-secret');
    await expect(adminSecretInput).toBeVisible();
    await adminSecretInput.fill('LITERATURE_ADMIN_MASTER_KEY_2026');

    await page.click('#btn-submit-register');

    // Verify Admin role badge and Admin Dashboard header button
    await expect(page.locator('.user-name')).toHaveText('Curator Hastings');
    await expect(page.locator('.user-role-tag')).toHaveText('ADMIN');
    await expect(page.locator('#nav-admin')).toBeVisible();
  });

  test('Positive: "Continue with Google" one-click button authenticates reader in browser', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.click('#btn-open-login');

    const googleBtn = page.locator('#btn-google-auth');
    await expect(googleBtn).toBeVisible();
    await googleBtn.click();

    // Verify user profile appears
    await expect(page.locator('.user-name')).toHaveText('Scholar Reader');
    await expect(page.locator('.user-role-tag')).toHaveText('READER');
  });

  test('Positive: Authenticated user can sign out and return to anonymous visitor view', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.click('#btn-open-login');
    await page.fill('#login-email', 'julian@literature.org');
    await page.fill('#login-password', 'ReaderPassword123!');
    await page.click('#btn-submit-login');

    await expect(page.locator('.user-name')).toBeVisible();

    // Click logout
    await page.click('#btn-logout');

    // Returns to anonymous visitor state
    await expect(page.locator('#btn-open-login')).toBeVisible();
    await expect(page.locator('.user-name')).not.toBeVisible();
  });
});
