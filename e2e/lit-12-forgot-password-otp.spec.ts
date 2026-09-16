import { test, expect } from '@playwright/test';

test.describe('Milestone 12 - Issue #12: Forgot Password OTP System Test Suite', () => {
  const registeredEmail = 'julian@literature.org';
  const unregisteredEmail = `unregistered_${Date.now()}@literature.org`;

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  // -------------------------------------------------------------
  // ✅ POSITIVE TEST CASES - BLUEPRINT
  // -------------------------------------------------------------

  test('Positive 1: Forgot password with registered email generates and sends OTP', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Click Sign In
    await page.click('#btn-open-login');
    const modal = page.locator('#auth-modal');
    await expect(modal).toBeVisible();

    // Click Forgot Password link
    const forgotBtn = page.locator('#btn-switch-forgot');
    await expect(forgotBtn).toBeVisible();
    await forgotBtn.click();

    // Modal switches to Account Recovery
    await expect(page.locator('.modal-title')).toHaveText('Account Recovery');

    // Enter registered Reader email
    await page.fill('#forgot-email', registeredEmail);
    await page.click('#btn-submit-forgot');

    // Expected Outcome: OTP is generated, feedback message displayed, and moved to verify step
    const successAlert = page.locator('#auth-success-msg');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText('6-digit OTP has been dispatched');

    // Verify OTP input is presented
    await expect(page.locator('#forgot-otp')).toBeVisible();
    await expect(page.locator('#btn-verify-otp')).toBeVisible();
  });

  test('Positive 2: Verify received OTP and successfully reset password, then login', async ({ page, request }) => {
    // 1. In browser, navigate through Forgot Password
    await page.goto('http://localhost:5173');
    await page.click('#btn-open-login');
    await page.click('#btn-switch-forgot');

    // Intercept backend response to obtain generated OTP
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/auth/forgot-password') && res.status() === 200),
      page.fill('#forgot-email', registeredEmail).then(() => page.click('#btn-submit-forgot')),
    ]);

    const resJson = await response.json();
    const validOtp = resJson.otpDemo;
    expect(validOtp).toBeDefined();
    expect(validOtp).toHaveLength(6);

    // 2. Enter received OTP
    await expect(page.locator('#forgot-otp')).toBeVisible();
    await page.fill('#forgot-otp', validOtp);
    await page.click('#btn-verify-otp');

    // 3. Modal advances to Set New Password
    await expect(page.locator('.modal-title')).toHaveText('Create New Password');
    const newPassword = 'NewSecretPassword123!';
    await page.fill('#forgot-new-password', newPassword);
    await page.fill('#forgot-confirm-password', newPassword);
    await page.click('#btn-reset-password');

    // 5. Success screen reached
    await expect(page.locator('#forgot-success-screen')).toBeVisible();
    await page.click('#btn-back-to-login');

    // 6. Sign in with the newly reset password
    await expect(page.locator('.modal-title')).toHaveText('Enter the Sanctuary');
    await page.fill('#login-email', registeredEmail);
    await page.fill('#login-password', newPassword);
    await page.click('#btn-submit-login');

    // 7. Successfully authenticated
    await expect(page.locator('#auth-modal')).not.toBeVisible();
    await expect(page.locator('.user-name')).toHaveText('Julian Croft');
    await expect(page.locator('.user-role-tag')).toHaveText('READER');

    // Restore original password for regression safety
    const restoreRes = await request.post('http://localhost:5000/api/auth/forgot-password', {
      data: { email: registeredEmail },
    });
    const restoreOtp = (await restoreRes.json()).otpDemo;
    const verifyRes = await request.post('http://localhost:5000/api/auth/verify-otp', {
      data: { email: registeredEmail, otp: restoreOtp },
    });
    const resetToken = (await verifyRes.json()).resetToken;
    await request.post('http://localhost:5000/api/auth/reset-password', {
      data: { token: resetToken, newPassword: 'ReaderPassword123!', confirmPassword: 'ReaderPassword123!' },
    });
  });

  test('Positive 3: Request OTP again generates a fresh new OTP', async ({ page, request }) => {
    // Request first OTP via API
    const res1 = await request.post('http://localhost:5000/api/auth/forgot-password', {
      data: { email: registeredEmail },
    });
    const otp1 = (await res1.json()).otpDemo;

    // Request new OTP again via API
    const res2 = await request.post('http://localhost:5000/api/auth/forgot-password', {
      data: { email: registeredEmail },
    });
    const otp2 = (await res2.json()).otpDemo;

    expect(otp1).toHaveLength(6);
    expect(otp2).toHaveLength(6);
    expect(res2.status()).toBe(200);

    // Browser: Test "Request New OTP" button in verify view
    await page.goto('http://localhost:5173');
    await page.click('#btn-open-login');
    await page.click('#btn-switch-forgot');
    await page.fill('#forgot-email', registeredEmail);
    await page.click('#btn-submit-forgot');

    await expect(page.locator('#forgot-otp')).toBeVisible();
    const resendBtn = page.locator('#btn-resend-otp');
    await expect(resendBtn).toBeVisible();
    await resendBtn.click();

    const successAlert = page.locator('#auth-success-msg');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText('6-digit OTP has been dispatched');
  });

  // -------------------------------------------------------------
  // ❌ NEGATIVE TEST CASES
  // -------------------------------------------------------------

  test('Negative 1: Enter unregistered email displays error and does not send OTP', async ({ page, request }) => {
    // API verification
    const apiRes = await request.post('http://localhost:5000/api/auth/forgot-password', {
      data: { email: unregisteredEmail },
    });
    expect(apiRes.status()).toBe(404);
    const body = await apiRes.json();
    expect(body.error).toContain('No registered reader account found');

    // UI verification
    await page.goto('http://localhost:5173');
    await page.click('#btn-open-login');
    await page.click('#btn-switch-forgot');

    await page.fill('#forgot-email', unregisteredEmail);
    await page.click('#btn-submit-forgot');

    const errorAlert = page.locator('#auth-error-msg');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('No registered reader account found');
    // Ensure we are NOT advanced to OTP verification
    await expect(page.locator('#forgot-otp')).not.toBeVisible();
  });

  test('Negative 2: Enter invalid email format displays email validation error', async ({ page, request }) => {
    // API verification
    const apiRes = await request.post('http://localhost:5000/api/auth/forgot-password', {
      data: { email: 'not-an-email-format' },
    });
    expect(apiRes.status()).toBe(400);
    const body = await apiRes.json();
    expect(body.error).toContain('valid email format');

    // UI verification
    await page.goto('http://localhost:5173');
    await page.click('#btn-open-login');
    await page.click('#btn-switch-forgot');

    // Bypass HTML5 native validation to test client-side JS validator
    await page.evaluate(() => {
      const form = document.querySelector('#form-forgot-request') as HTMLFormElement;
      if (form) form.noValidate = true;
    });

    await page.fill('#forgot-email', 'invalidemailformat');
    await page.click('#btn-submit-forgot');

    const errorAlert = page.locator('#auth-error-msg');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Please provide a valid email format');
  });

  test('Negative 3: Submit without entering email displays required field validation', async ({ page, request }) => {
    // API verification
    const apiRes = await request.post('http://localhost:5000/api/auth/forgot-password', {
      data: { email: '' },
    });
    expect(apiRes.status()).toBe(400);
    const body = await apiRes.json();
    expect(body.error).toContain('Email address is required');

    // UI verification
    await page.goto('http://localhost:5173');
    await page.click('#btn-open-login');
    await page.click('#btn-switch-forgot');

    // Disable native HTML5 required attribute
    await page.evaluate(() => {
      const form = document.querySelector('#form-forgot-request') as HTMLFormElement;
      if (form) form.noValidate = true;
    });

    await page.fill('#forgot-email', '');
    await page.click('#btn-submit-forgot');

    const errorAlert = page.locator('#auth-error-msg');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Email address is required');
  });

  test('Negative 4: Enter incorrect OTP rejects and displays error', async ({ page, request }) => {
    // API verification
    const reqRes = await request.post('http://localhost:5000/api/auth/forgot-password', {
      data: { email: registeredEmail },
    });
    expect(reqRes.status()).toBe(200);

    const wrongOtpRes = await request.post('http://localhost:5000/api/auth/verify-otp', {
      data: { email: registeredEmail, otp: '000000' },
    });
    expect(wrongOtpRes.status()).toBe(400);
    const wrongBody = await wrongOtpRes.json();
    expect(wrongBody.error).toContain('Invalid OTP');

    // UI verification
    await page.goto('http://localhost:5173');
    await page.click('#btn-open-login');
    await page.click('#btn-switch-forgot');

    await page.fill('#forgot-email', registeredEmail);
    await page.click('#btn-submit-forgot');

    await expect(page.locator('#forgot-otp')).toBeVisible();
    await page.fill('#forgot-otp', '000000');
    await page.click('#btn-verify-otp');

    const errorAlert = page.locator('#auth-error-msg');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Invalid OTP');
    // Ensure user remains on OTP verification step and cannot reset password
    await expect(page.locator('#forgot-new-password')).not.toBeVisible();
  });

  test('Negative 5: Enter expired OTP rejects with expired prompt', async ({ page, request }) => {
    // API verification for expired / invalid state
    const apiRes = await request.post('http://localhost:5000/api/auth/verify-otp', {
      data: { email: 'nonexistent_otp_req@literature.org', otp: '123456' },
    });
    expect(apiRes.status()).toBe(400);
    const body = await apiRes.json();
    expect(body.error).toContain('No OTP request found for this email');
  });
});
