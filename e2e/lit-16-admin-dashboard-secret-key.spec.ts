import { test, expect } from '@playwright/test';

test.describe('Sprint 16 / LIT-16: Admin Dashboard, KPI Cards & Admin Secret Invitation Key', () => {
  const ADMIN_KEY = 'ath_cur_sec_9f83a27e4b1c8d5062a4192d';

  test.beforeEach(async ({ page, request }) => {
    // Reset rate limiter so tests don't pollute each other's rate counters
    try {
      await request.post('http://localhost:5000/api/auth/reset-admin-rate-limit');
    } catch (e) {}

    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });


  // =========================================================================
  // 1. POSITIVE TEST CASES: ADMIN INVITATION & REGISTRATION
  // =========================================================================

  test('1.1 Enter valid Admin invitation key: Admin account created with ADMIN role', async ({ page }) => {
    await page.click('#btn-open-register');
    await expect(page.locator('#auth-modal')).toBeVisible();

    const uniqueEmail = `curator_${Date.now()}@literature.org`;

    await page.fill('#reg-name', 'Curator Beatrice');
    await page.fill('#reg-email', uniqueEmail);
    await page.fill('#reg-password', 'CuratorPass123!');
    await page.fill('#reg-confirm', 'CuratorPass123!');

    // Toggle Admin Secret Key input
    await page.click('#toggle-admin-secret');
    await expect(page.locator('#reg-admin-secret')).toBeVisible();
    await page.fill('#reg-admin-secret', ADMIN_KEY);

    // Submit registration
    await page.click('#btn-submit-register');

    // Should successfully authenticate and land in scholar session
    await expect(page.locator('#auth-modal')).toBeHidden({ timeout: 5000 });
    const userBanner = page.locator('#active-user-banner');
    await expect(userBanner).toBeVisible();
    await expect(userBanner).toContainText('ADMIN');
    await expect(userBanner).toContainText('Curator Beatrice');
  });

  test('1.2 Login with valid Admin credentials: Admin can access Admin Dashboard', async ({ page }) => {
    await page.click('#btn-open-login');
    await page.fill('#login-email', 'admin@literature.org');
    await page.fill('#login-password', 'AdminPassword123!');
    await page.click('#btn-submit-login');

    await expect(page.locator('#active-user-banner')).toBeVisible();
    await expect(page.locator('#nav-admin')).toBeVisible();

    // Click Admin Dashboard navigation link
    await page.click('#nav-admin');
    await expect(page.locator('#admin-editorial-view')).toBeVisible();
    await expect(page.locator('#editorial-studio-heading')).toBeVisible();
  });

  // =========================================================================
  // 2. POSITIVE TEST CASES: 11 FUNCTIONAL KPI CARDS & DATABASE DATA
  // =========================================================================

  test('2.1 Admin Dashboard displays all 11 real database KPI cards with proper non-zero values', async ({ page }) => {
    // Sign in as Admin
    await page.click('#btn-open-login');
    await page.fill('#login-email', 'admin@literature.org');
    await page.fill('#login-password', 'AdminPassword123!');
    await page.click('#btn-submit-login');
    await page.click('#nav-admin');

    // Click Live Dashboard / executive analytics tab
    await page.click('#tab-btn-executive-analytics');
    await expect(page.locator('#kpi-cards-container')).toBeVisible();

    // Verify all 11 KPI Cards exist and display values
    const kpiIds = [
      '#kpi-total-literature',
      '#kpi-published-literature',
      '#kpi-draft-literature',
      '#kpi-unpublished-literature',
      '#kpi-registered-readers',
      '#kpi-total-ratings',
      '#kpi-average-rating',
      '#kpi-total-comments',
      '#kpi-total-saves',
      '#kpi-new-users',
      '#kpi-new-releases',
    ];

    for (const id of kpiIds) {
      const card = page.locator(id);
      await expect(card).toBeVisible();
      const valText = await card.locator('.kpi-card-value').innerText();
      expect(valText.trim().length).toBeGreaterThan(0);
    }

    // Verify specific seeded database facts
    // Total Literature >= 6
    const totalLit = await page.locator('#kpi-val-total-literature').innerText();
    expect(parseInt(totalLit, 10)).toBeGreaterThanOrEqual(6);

    // Published Literature >= 5
    const pubLit = await page.locator('#kpi-val-published-literature').innerText();
    expect(parseInt(pubLit, 10)).toBeGreaterThanOrEqual(5);

    // Draft Literature >= 1
    const draftLit = await page.locator('#kpi-val-draft-literature').innerText();
    expect(parseInt(draftLit, 10)).toBeGreaterThanOrEqual(1);

    // Registered Readers >= 2 (excluding admin)
    const readers = await page.locator('#kpi-val-registered-readers').innerText();
    expect(parseInt(readers, 10)).toBeGreaterThanOrEqual(2);
  });

  // =========================================================================
  // 3. POSITIVE TEST CASES: DASHBOARD SECTIONS & QUICK ACTIONS
  // =========================================================================

  test('3.1 Admin Dashboard sections: Quick Actions, Recent Literature, Popular Literature, Recent Comments, and Recent Activity', async ({ page }) => {
    await page.click('#btn-open-login');
    await page.fill('#login-email', 'admin@literature.org');
    await page.fill('#login-password', 'AdminPassword123!');
    await page.click('#btn-submit-login');
    await page.click('#nav-admin');
    await page.click('#tab-btn-executive-analytics');

    // Quick Actions Bar
    await expect(page.locator('#admin-quick-actions')).toBeVisible();
    await expect(page.locator('#btn-qa-add-literature')).toBeVisible();
    await expect(page.locator('#btn-qa-manage-literature')).toBeVisible();
    await expect(page.locator('#btn-qa-manage-categories')).toBeVisible();
    await expect(page.locator('#btn-qa-manage-users')).toBeVisible();
    await expect(page.locator('#btn-qa-manage-comments')).toBeVisible();
    await expect(page.locator('#btn-qa-settings')).toBeVisible();

    // Section 1: Recent Literature
    await expect(page.locator('#panel-recent-literature')).toBeVisible();
    await expect(page.locator('#recent-literature-list')).toBeVisible();

    // Section 2: Popular Literature
    await expect(page.locator('#panel-popular-literature')).toBeVisible();
    await expect(page.locator('#popular-literature-list')).toBeVisible();

    // Section 3: Recent Comments with Moderation Status
    await expect(page.locator('#panel-recent-comments')).toBeVisible();
    await expect(page.locator('#recent-comments-list')).toBeVisible();
    await expect(page.locator('#recent-comments-list .status-badge.published').first()).toHaveText('APPROVED');

    // Section 4: Recent Activity (Audit Trail)
    await expect(page.locator('#panel-recent-activity')).toBeVisible();
    await expect(page.locator('#recent-activity-list')).toBeVisible();

    // Test interactive Quick Action button (Manage Categories modal)
    await page.click('#btn-qa-manage-categories');
    await expect(page.locator('.modal-plate')).toContainText('Manage Curatorial Categories');
    await page.click('.btn-close');
  });

  // =========================================================================
  // 4. POSITIVE TEST CASES: LITERATURE CREATION, PUBLICATION & INDIAN LANGUAGES
  // =========================================================================

  test('4.1 Admin creates, publishes, unpublishes literature in Hindi & Kannada', async ({ page }) => {
    await page.click('#btn-open-login');
    await page.fill('#login-email', 'admin@literature.org');
    await page.fill('#login-password', 'AdminPassword123!');
    await page.click('#btn-submit-login');
    await page.click('#nav-admin');

    // 1. Create Hindi manuscript
    await page.click('#tab-btn-create-manuscript');
    const hindiTitle = `निर्मला (Nirmala) - Test ${Date.now()}`;
    await page.fill('#lit-title', hindiTitle);
    await page.fill('#lit-brief', 'मुंशी प्रेमचंद का संवेदनशील उपन्यास।');
    await page.fill('#lit-content', 'यह एक अनमोल साहित्यिक कृति है जो दहेज और अनमेल विवाह की समस्या को उठाती है।');
    await page.selectOption('#lit-language', 'Hindi');

    // Save as Draft first
    await page.click('#btn-save-draft');
    await expect(page.locator('#editorial-alert-success')).toBeVisible();

    // 2. Go to Archival Registry to inspect and publish
    await page.click('#tab-btn-manage-works');
    await expect(page.locator('.works-table')).toContainText(hindiTitle);

    // Find the row and click Publish
    const row = page.locator('tr', { hasText: hindiTitle });
    await expect(row.locator('.status-badge.draft')).toBeVisible();
    await row.locator('.btn-action-pill.publish').click();

    // Status transitions to PUBLISHED
    await expect(row.locator('.status-badge.published')).toBeVisible();

    // Unpublish
    await row.locator('.btn-action-pill.unpublish').click();
    await expect(row.locator('.status-badge.unpublished')).toBeVisible();
  });

  // =========================================================================
  // 5. NEGATIVE TEST CASES: ADMIN INVITATION KEY & SECURITY
  // =========================================================================

  test('5.1 Negative: Reject Admin registration with invalid invitation key', async ({ page }) => {
    await page.click('#btn-open-register');
    await page.fill('#reg-name', 'Fraudster Admin');
    await page.fill('#reg-email', `fraud_${Date.now()}@literature.org`);
    await page.fill('#reg-password', 'HackerPass123!');
    await page.fill('#reg-confirm', 'HackerPass123!');

    await page.click('#toggle-admin-secret');
    await page.fill('#reg-admin-secret', 'WrongFakeKey12345');
    await page.click('#btn-submit-register');

    // Generic error expected
    const errorAlert = page.locator('#auth-error-msg');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toHaveText('Invalid Admin invitation key.');
  });

  test('5.2 Negative: Reject Admin registration when invitation key is empty', async ({ page }) => {
    await page.click('#btn-open-register');
    await page.fill('#reg-name', 'Empty Key User');
    await page.fill('#reg-email', `empty_${Date.now()}@literature.org`);
    await page.fill('#reg-password', 'HackerPass123!');
    await page.fill('#reg-confirm', 'HackerPass123!');

    await page.click('#toggle-admin-secret');
    const keyInput = page.locator('#reg-admin-secret');
    await expect(keyInput).toBeVisible();
    await expect(keyInput).toHaveAttribute('required', '');

    // Submit with empty key
    await page.click('#btn-submit-register');

    // HTML5 validation or form error prevents submission
    const isInvalid = await keyInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
    expect(isInvalid).toBe(true);
  });

  test('5.3 Negative: Reader cannot access Admin Dashboard UI or admin endpoints', async ({ page, request }) => {
    // 1. UI guard test
    await page.click('#btn-open-login');
    await page.fill('#login-email', 'julian@literature.org');
    await page.fill('#login-password', 'ReaderPassword123!');
    await page.click('#btn-submit-login');

    // Wait for login success
    await expect(page.locator('#auth-modal')).toBeHidden();
    await expect(page.locator('#active-user-banner')).toContainText('READER');

    // Nav-admin button must not be present for READER
    await expect(page.locator('#nav-admin')).toBeHidden();

    // 2. Direct API attempt with Reader token
    const token = await page.evaluate(() => localStorage.getItem('literature_token'));
    expect(token).toBeTruthy();

    const statsRes = await request.get('http://localhost:5000/api/admin/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(statsRes.status()).toBe(403);
    const body = await statsRes.json();
    expect(body.error).toContain('Access denied. Requires ADMIN role');
  });


  test('5.4 Negative: Visitor (unauthenticated) cannot access Admin API', async ({ request }) => {
    const statsRes = await request.get('http://localhost:5000/api/admin/dashboard/stats');
    expect(statsRes.status()).toBe(401);
    const body = await statsRes.json();
    expect(body.error).toContain('Authentication required');
  });

  test('5.5 Negative: Reader cannot escalate role to ADMIN via modified API payload', async ({ request }) => {
    // Attempt normal registration with injected role="ADMIN" without invitation key
    const res = await request.post('http://localhost:5000/api/auth/register', {
      data: {
        name: 'Privilege Escalation Tester',
        email: `escalation_${Date.now()}@literature.org`,
        password: 'ReaderPass123!',
        confirmPassword: 'ReaderPass123!',
        role: 'ADMIN', // Request manipulation attempt
      },
    });

    // Should be rejected because Admin Secret Invitation Key is missing
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Admin Secret Invitation Key is required');
  });

  test('5.6 Negative: Repeated failed Admin invitation key attempts trigger rate limiting (HTTP 429)', async ({ request }) => {
    // Send repeated failed admin registration requests
    let rateLimited = false;
    for (let i = 0; i < 7; i++) {
      const res = await request.post('http://localhost:5000/api/auth/register', {
        data: {
          name: `Brute Force ${i}`,
          email: `bruteforce_${Date.now()}_${i}@literature.org`,
          password: 'Password123!',
          confirmPassword: 'Password123!',
          adminSecret: `WrongKeyAttempt${i}`,
        },
      });

      if (res.status() === 429) {
        rateLimited = true;
        const body = await res.json();
        expect(body.error).toContain('Too many failed Admin invitation attempts');
        break;
      }
    }
    expect(rateLimited).toBe(true);
  });

  test('5.7 Security Verification: Secret key is never exposed in frontend scripts', async ({ page }) => {
    const content = await page.content();
    // Ensure the secret value is not found in DOM or loaded page
    expect(content.includes(ADMIN_KEY)).toBe(false);
  });
});
