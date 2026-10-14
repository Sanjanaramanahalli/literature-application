import { test, expect } from '@playwright/test';

test.describe('LIT-22: Admin and Reader Login & Role Access Suite', () => {
  const adminEmail = 'admin@literature.org';
  const adminPassword = 'AdminPassword123!';
  const readerEmail = 'julian@literature.org';
  const readerPassword = 'ReaderPassword123!';

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test('P1: Admin login with valid credentials redirects to Admin dashboard', async ({ page }) => {
    // 1. Open login modal
    const openLoginBtn = page.locator('#btn-open-login');
    await expect(openLoginBtn).toBeVisible();
    await openLoginBtn.click();

    const authModal = page.locator('#auth-modal');
    await expect(authModal).toBeVisible();

    // 2. Fill admin credentials
    await page.locator('#login-email').fill(adminEmail);
    await page.locator('#login-password').fill(adminPassword);

    // 3. Click Login
    await page.locator('#btn-submit-login').click();

    // 4. Verify modal closes, admin is authenticated and redirected to Admin dashboard
    await expect(authModal).not.toBeVisible();
    const activeBanner = page.locator('#active-user-banner');
    await expect(activeBanner).toBeVisible();
    await expect(activeBanner).toContainText('ADMIN');
    await expect(activeBanner).toContainText(adminEmail);

    // Admin dashboard / Editorial studio is displayed
    const adminDashboard = page.locator('#admin-editorial-view');
    await expect(adminDashboard).toBeVisible();
    await expect(page.locator('#editorial-studio-heading')).toBeVisible();

    // Admin dashboard nav button is active
    await expect(page.locator('#nav-admin')).toHaveClass(/active/);
  });

  test('P2: Reader login with valid credentials redirects to Reader dashboard', async ({ page }) => {
    // 1. Open login modal
    const openLoginBtn = page.locator('#btn-open-login');
    await expect(openLoginBtn).toBeVisible();
    await openLoginBtn.click();

    const authModal = page.locator('#auth-modal');
    await expect(authModal).toBeVisible();

    // 2. Fill reader credentials
    await page.locator('#login-email').fill(readerEmail);
    await page.locator('#login-password').fill(readerPassword);

    // 3. Click Login
    await page.locator('#btn-submit-login').click();

    // 4. Verify modal closes, reader is authenticated and redirected to Reader dashboard (Saved Works)
    await expect(authModal).not.toBeVisible();
    const activeBanner = page.locator('#active-user-banner');
    await expect(activeBanner).toBeVisible();
    await expect(activeBanner).toContainText('READER');
    await expect(activeBanner).toContainText(readerEmail);

    // Reader personal reading sanctuary / saved works dashboard is displayed
    const readerDashboard = page.locator('#saved-works-view');
    await expect(readerDashboard).toBeVisible();
    await expect(page.locator('#saved-works-view .saved-main-title')).toHaveText('Personal Reading Sanctuary');

    // Reader saved nav link is active
    await expect(page.locator('#nav-saved')).toHaveClass(/active/);
  });

  test('P3: Login after page refresh keeps session valid', async ({ page }) => {
    // 1. Log in as Reader
    await page.locator('#btn-open-login').click();
    await page.locator('#login-email').fill(readerEmail);
    await page.locator('#login-password').fill(readerPassword);
    await page.locator('#btn-submit-login').click();
    await expect(page.locator('#auth-modal')).not.toBeVisible();

    // 2. Verify active session banner is shown
    await expect(page.locator('#active-user-banner')).toContainText('READER');

    // 3. Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 4. Verify session remains active without re-authenticating
    const activeBanner = page.locator('#active-user-banner');
    await expect(activeBanner).toBeVisible();
    await expect(activeBanner).toContainText('READER');
    await expect(page.locator('#btn-logout')).toBeVisible();
  });

  test('N1: Incorrect password rejects login with appropriate error message', async ({ page }) => {
    await page.locator('#btn-open-login').click();
    await expect(page.locator('#auth-modal')).toBeVisible();

    // Enter valid email but incorrect password
    await page.locator('#login-email').fill(readerEmail);
    await page.locator('#login-password').fill('CompletelyWrongPassword999!');
    await page.locator('#btn-submit-login').click();

    // Appropriate error message is displayed
    const errorMsg = page.locator('#auth-error-msg');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('Invalid email or password');

    // User is NOT authenticated
    await expect(page.locator('#active-user-banner')).not.toBeVisible();
    await expect(page.locator('#btn-open-login')).toBeVisible();
  });

  test('N2: Unregistered email rejects login with appropriate error message', async ({ page }) => {
    await page.locator('#btn-open-login').click();
    await expect(page.locator('#auth-modal')).toBeVisible();

    // Enter unregistered email
    await page.locator('#login-email').fill('nonexistent.user.987654@literature.org');
    await page.locator('#login-password').fill('SomePassword123!');
    await page.locator('#btn-submit-login').click();

    // Appropriate error message is displayed
    const errorMsg = page.locator('#auth-error-msg');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('Invalid email or password');

    // User is NOT authenticated
    await expect(page.locator('#active-user-banner')).not.toBeVisible();
    await expect(page.locator('#btn-open-login')).toBeVisible();
  });

  test('N3: Empty email or password triggers required-field validation and halts submit', async ({ page }) => {
    await page.locator('#btn-open-login').click();
    await expect(page.locator('#auth-modal')).toBeVisible();

    // 1. Leave email empty, fill password
    await page.locator('#login-email').fill('');
    await page.locator('#login-password').fill('SomePassword123!');

    // Check HTML5 required constraint
    const emailInput = page.locator('#login-email');
    const isEmailRequired = await emailInput.getAttribute('required');
    expect(isEmailRequired).not.toBeNull();

    // Click submit
    await page.locator('#btn-submit-login').click();
    // Modal stays open and user remains unauthenticated
    await expect(page.locator('#auth-modal')).toBeVisible();
    await expect(page.locator('#active-user-banner')).not.toBeVisible();

    // 2. Fill email, leave password empty
    await page.locator('#login-email').fill(readerEmail);
    await page.locator('#login-password').fill('');

    const passwordInput = page.locator('#login-password');
    const isPasswordRequired = await passwordInput.getAttribute('required');
    expect(isPasswordRequired).not.toBeNull();

    await page.locator('#btn-submit-login').click();
    await expect(page.locator('#auth-modal')).toBeVisible();
    await expect(page.locator('#active-user-banner')).not.toBeVisible();
  });

  test('N4: Role-based access control restricts unauthorized features', async ({ page }) => {
    // 1. Log in as a Reader
    await page.locator('#btn-open-login').click();
    await page.locator('#login-email').fill(readerEmail);
    await page.locator('#login-password').fill(readerPassword);
    await page.locator('#btn-submit-login').click();
    await expect(page.locator('#auth-modal')).not.toBeVisible();
    await expect(page.locator('#active-user-banner')).toContainText('READER');

    // 2. Verify reader does NOT see Admin Dashboard link in the navigation
    await expect(page.locator('#nav-admin')).not.toBeVisible();

    // 3. Attempting to click admin sign-in or navigating to admin tab triggers guard
    const adminSignInNav = page.locator('#nav-admin-signin');
    if (await adminSignInNav.isVisible()) {
      await adminSignInNav.click();
      // Try to submit reader credentials to admin endpoint
      await page.locator('#admin-email').fill(readerEmail);
      await page.locator('#admin-password').fill(readerPassword);
      await page.locator('#btn-submit-admin-signin').click();

      // Should be rejected because reader role is not permitted to access Admin Studio
      const adminError = page.locator('#admin-signin-error');
      await expect(adminError).toBeVisible();
      await expect(adminError).toContainText(/Access denied|not authorized/i);
    }
  });
});
