import { test, expect } from '@playwright/test';

test.describe('Sprint 15 / LIT-15: Full-Stack Application Updates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  // =========================================================================
  // 1. Password Visibility (Show/Hide) Toggles
  // =========================================================================
  test('1.1 Login Modal: Password is hidden by default and toggles visibility via eye icon', async ({ page }) => {
    await page.click('#btn-open-login');
    await expect(page.locator('#auth-modal')).toBeVisible();

    const passwordInput = page.locator('#login-password');
    const toggleBtn = page.locator('#toggle-login-password');

    // Default: hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(toggleBtn).toHaveAttribute('aria-label', 'Show password');

    // Type text and click toggle
    await passwordInput.fill('SecretPass123!');
    await toggleBtn.click();

    // Toggled: visible
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await expect(toggleBtn).toHaveAttribute('aria-label', 'Hide password');

    // Toggle back
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(toggleBtn).toHaveAttribute('aria-label', 'Show password');
  });

  test('1.2 Registration Modal: Password & Confirm Password support independent visibility toggles', async ({ page }) => {
    await page.click('#btn-open-login');
    await page.click('#btn-switch-register');

    const regPass = page.locator('#reg-password');
    const toggleRegPass = page.locator('#toggle-reg-password');
    const regConfirm = page.locator('#reg-confirm');
    const toggleRegConfirm = page.locator('#toggle-reg-confirm');

    // Both hidden by default
    await expect(regPass).toHaveAttribute('type', 'password');
    await expect(regConfirm).toHaveAttribute('type', 'password');

    // Toggle regPass
    await toggleRegPass.click();
    await expect(regPass).toHaveAttribute('type', 'text');
    await expect(regConfirm).toHaveAttribute('type', 'password');

    // Toggle regConfirm
    await toggleRegConfirm.click();
    await expect(regPass).toHaveAttribute('type', 'text');
    await expect(regConfirm).toHaveAttribute('type', 'text');

    // Toggle regPass back
    await toggleRegPass.click();
    await expect(regPass).toHaveAttribute('type', 'password');
    await expect(regConfirm).toHaveAttribute('type', 'text');
  });

  test('1.3 Reset Password Step: New Password & Confirm Password support visibility toggles', async ({ page, request }) => {
    // Generate valid OTP for registered reader
    const readerEmail = 'julian@literature.org';
    const forgotRes = await request.post('http://localhost:5000/api/auth/forgot-password', {
      data: { email: readerEmail },
    });
    expect(forgotRes.ok()).toBeTruthy();
    const forgotBody = await forgotRes.json();
    const otp = forgotBody.otpDemo;
    expect(otp).toBeTruthy();

    await page.click('#btn-open-login');
    await page.click('#btn-switch-forgot');
    await page.fill('#forgot-email', 'julian@literature.org');
    await page.click('#btn-submit-forgot');

    // Open registered mailbox inside modal and insert OTP
    const openInboxBtn = page.locator('#btn-open-inbox');
    await expect(openInboxBtn).toBeVisible();
    await openInboxBtn.click();

    const autofillBtn = page.locator('#btn-autofill-otp');
    await expect(autofillBtn).toBeVisible();
    await autofillBtn.click();

    // Verify OTP field contains 6 digits and submit
    await expect(page.locator('#forgot-otp')).toHaveValue(/^\d{6}$/);
    await page.click('#btn-verify-otp');

    // Arrive at reset form
    await expect(page.locator('#form-forgot-reset')).toBeVisible();
    const newPass = page.locator('#forgot-new-password');
    const toggleNewPass = page.locator('#toggle-forgot-password');
    const confirmPass = page.locator('#forgot-confirm-password');
    const toggleConfirmPass = page.locator('#toggle-forgot-confirm-password');

    // Hidden by default
    await expect(newPass).toHaveAttribute('type', 'password');
    await expect(confirmPass).toHaveAttribute('type', 'password');

    // Toggle newPass
    await toggleNewPass.click();
    await expect(newPass).toHaveAttribute('type', 'text');
    await expect(confirmPass).toHaveAttribute('type', 'password');

    // Toggle confirmPass
    await toggleConfirmPass.click();
    await expect(confirmPass).toHaveAttribute('type', 'text');
  });

  // =========================================================================
  // 2. Admin Dashboard KPI Cards & Stats API
  // =========================================================================
  test('2.1 GET /api/admin/dashboard/stats rejects unauthenticated and reader callers', async ({ request }) => {
    // Unauthenticated -> 401
    const anonRes = await request.get('http://localhost:5000/api/admin/dashboard/stats');
    expect(anonRes.status()).toBe(401);

    // Reader login -> 403
    const loginRes = await request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: 'julian@literature.org',
        password: 'ReaderPassword123!',
      },
    });
    expect(loginRes.ok()).toBeTruthy();
    const { token: readerToken } = await loginRes.json();

    const readerRes = await request.get('http://localhost:5000/api/admin/dashboard/stats', {
      headers: { Authorization: `Bearer ${readerToken}` },
    });
    expect(readerRes.status()).toBe(403);
  });

  test('2.2 GET /api/admin/dashboard/stats returns real database metrics for Admin', async ({ request }) => {
    const adminLoginRes = await request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: 'admin@literature.org',
        password: 'AdminPassword123!',
      },
    });
    expect(adminLoginRes.ok()).toBeTruthy();
    const { token: adminToken } = await adminLoginRes.json();

    const statsRes = await request.get('http://localhost:5000/api/admin/dashboard/stats', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(statsRes.ok()).toBeTruthy();
    const data = await statsRes.json();

    // Verify all 8 core metrics + monthly stats
    expect(data.totalLiterature).toBeGreaterThanOrEqual(5);
    expect(data.publishedLiterature).toBeGreaterThanOrEqual(4);
    expect(data.draftLiterature).toBeGreaterThanOrEqual(1);
    expect(data.registeredReaders).toBe(2);
    expect(data.totalRatings).toBeGreaterThanOrEqual(3);
    expect(data.averageRating).toBeGreaterThanOrEqual(1);
    expect(data.totalComments).toBeGreaterThanOrEqual(3);
    expect(data.totalSaves).toBeGreaterThanOrEqual(1);
    expect(data.newUsersThisMonth).toBeDefined();
    expect(data.newReleasesThisMonth).toBeDefined();
  });

  test('2.3 Admin Dashboard renders all 10 responsive KPI cards', async ({ page }) => {
    // Log in as Admin
    await page.click('#btn-open-login');
    await page.fill('#login-email', 'admin@literature.org');
    await page.fill('#login-password', 'AdminPassword123!');
    await page.click('#btn-submit-login');
    await expect(page.locator('#btn-logout')).toBeVisible();

    // Open Curatorial Suite / Analytics
    await page.click('#nav-admin');
    await page.click('#tab-btn-executive-analytics');

    // Verify presence of all cards
    await expect(page.locator('#kpi-total-literature')).toBeVisible();
    await expect(page.locator('#kpi-published-literature')).toBeVisible();
    await expect(page.locator('#kpi-draft-literature')).toBeVisible();
    await expect(page.locator('#kpi-registered-readers')).toBeVisible();
    await expect(page.locator('#kpi-total-ratings')).toBeVisible();
    await expect(page.locator('#kpi-average-rating')).toBeVisible();
    await expect(page.locator('#kpi-total-comments')).toBeVisible();
    await expect(page.locator('#kpi-total-saves')).toBeVisible();
    await expect(page.locator('#kpi-new-users')).toBeVisible();
    await expect(page.locator('#kpi-new-releases')).toBeVisible();
  });

  // =========================================================================
  // 3. Indian Language Literature Support (Hindi & Kannada)
  // =========================================================================
  test('3.1 Catalog View displays Indian language filters and correctly filters Hindi and Kannada works', async ({ page }) => {
    await page.click('#nav-explore');
    await expect(page.locator('#language-filter-bar')).toBeVisible();

    // Filter Hindi
    await page.click('#lang-filter-hindi');
    await expect(page.locator('#compendium-grid')).toContainText('गोदान (Godan)');
    await expect(page.locator('#compendium-grid')).not.toContainText('Hamlet, Prince of Denmark');

    // Filter Kannada
    await page.click('#lang-filter-kannada');
    await expect(page.locator('#compendium-grid')).toContainText('ಮಲೆಗಳಲ್ಲಿ ಮದುಮಗಳು (Malegalalli Madumagalu)');
    await expect(page.locator('#compendium-grid')).not.toContainText('The Death of Ivan Ilyich');

    // Filter All Languages
    await page.click('#lang-filter-all');
    await expect(page.locator('#compendium-grid')).toContainText('गोदान (Godan)');
    await expect(page.locator('#compendium-grid')).toContainText('ಮಲೆಗಳಲ್ಲಿ ಮದುಮಗಳು (Malegalalli Madumagalu)');
    await expect(page.locator('#compendium-grid')).toContainText('Hamlet, Prince of Denmark');
  });

  test('3.2 Advanced Search allows searching and filtering by Indian Languages with Unicode text', async ({ page }) => {
    await page.click('#nav-search');
    await expect(page.locator('#advanced-search-view')).toBeVisible();

    // Search by language: Hindi
    await page.selectOption('#search-input-language', 'Hindi');
    await expect(page.locator('#search-results-grid')).toContainText('गोदान (Godan)');
    await expect(page.locator('#search-results-grid')).not.toContainText('Hamlet');

    // Search by Unicode title in Kannada
    await page.selectOption('#search-input-language', '');
    await page.fill('#search-input-title', 'ಮದುಮಗಳು');
    await page.click('#btn-submit-search');
    await expect(page.locator('#search-results-grid')).toContainText('ಮಲೆಗಳಲ್ಲಿ ಮದುಮಗಳು (Malegalalli Madumagalu)');
  });

  test('3.3 Reader View displays Language tag for Indian literature and renders full Unicode script', async ({ page }) => {
    await page.click('#nav-explore');
    await page.click('#lang-filter-hindi');

    // Click into Hindi work
    await page.click('text="गोदान (Godan)"');
    await expect(page.locator('#reader-view-container')).toBeVisible();
    await expect(page.locator('#reader-title')).toContainText('गोदान (Godan)');
    await expect(page.locator('#reader-article-content')).toContainText('Hindi');
    await expect(page.locator('#reader-article-content')).toContainText('होरी महतो ने बैलों को सानी-पानी देकर');
  });

  // =========================================================================
  // 4. Forgot Password Flow Integrity (Zero Terminal OTP Exposure)
  // =========================================================================
  test('4.1 Forgot Password returns confirmation message and dispatches valid OTP', async ({ page, request }) => {
    const readerEmail = 'julian@literature.org';
    const forgotRes = await request.post('http://localhost:5000/api/auth/forgot-password', {
      data: { email: readerEmail },
    });
    expect(forgotRes.ok()).toBeTruthy();
    const data = await forgotRes.json();
    expect(data.message).toContain('dispatched');
    expect(data.otpDemo).toMatch(/^\d{6}$/);

    // Ethereal check: Ensure ZERO public ethereal message URLs
    expect(data.etherealUrl).toBeUndefined();
    expect(data.previewUrl).toBeUndefined();
  });
});
