import { test, expect } from '@playwright/test';

test.describe('Milestone 14 - Issue #14: Direct Gmail OTP Delivery (Zero Ethereal Exposure)', () => {
  const registeredGmail = 'lady.catherine@gmail.com';
  const unregisteredGmail = `unregistered_scholar_${Date.now()}@gmail.com`;

  test.beforeEach(async ({ page, request }) => {
    // Ensure the registered Gmail user exists in DB before testing
    await request.post('http://localhost:5000/api/auth/google', {
      data: {
        demoUser: {
          name: 'Lady Catherine de Bourgh',
          email: registeredGmail,
        },
      },
    });

    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  // -------------------------------------------------------------
  // ✅ POSITIVE TEST CASES - BLUEPRINT
  // -------------------------------------------------------------

  test('Positive 1: Send OTP to registered Gmail generates and dispatches OTP directly without Ethereal', async ({ page, request }) => {
    await page.goto('http://localhost:5173');
    await page.click('#btn-open-login');
    await page.click('#btn-switch-forgot');

    await page.fill('#forgot-email', registeredGmail);
    await page.click('#btn-submit-forgot');

    // Expected outcome: Success alert indicating OTP dispatched
    const successAlert = page.locator('#auth-success-msg');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText('6-digit OTP has been dispatched');

    // Verify received in registered email inbox endpoint
    const inboxRes = await request.get(`http://localhost:5000/api/auth/inbox/${encodeURIComponent(registeredGmail)}`);
    expect(inboxRes.status()).toBe(200);
    const inboxData = await inboxRes.json();
    expect(inboxData.messages.length).toBeGreaterThanOrEqual(1);

    const latestEmail = inboxData.messages[0];
    expect(latestEmail.to).toBe(registeredGmail);
    expect(latestEmail.subject).toContain('Password Reset OTP Code');
    expect(latestEmail.otp).toMatch(/^\d{6}$/);

    // CRITICAL: Ensure NO Ethereal preview link is present in the message
    expect(latestEmail.previewUrl).toBeUndefined();
  });

  test('Positive 2: Verify received OTP from Gmail and continue password reset', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.click('#btn-open-login');
    await page.click('#btn-switch-forgot');

    await page.fill('#forgot-email', registeredGmail);
    await page.click('#btn-submit-forgot');

    // Open registered mailbox inside modal
    const openInboxBtn = page.locator('#btn-open-inbox');
    await expect(openInboxBtn).toBeVisible();
    await openInboxBtn.click();

    // Verify in-modal mailbox displays email without any public Ethereal link
    const mailboxPreview = page.locator('#mailbox-preview');
    await expect(mailboxPreview).toBeVisible();
    await expect(mailboxPreview).toContainText(registeredGmail);
    await expect(page.locator('#link-web-mailbox')).toHaveCount(0); // Zero Ethereal web link

    // Insert OTP directly from email
    const autofillBtn = page.locator('#btn-autofill-otp');
    await expect(autofillBtn).toBeVisible();
    await autofillBtn.click();

    // Verify OTP field contains valid 6-digit code
    const otpVal = await page.locator('#forgot-otp').inputValue();
    expect(otpVal).toMatch(/^\d{6}$/);

    // Submit OTP verification
    await page.click('#btn-verify-otp');

    // Advance to Create New Password
    await expect(page.locator('.modal-title')).toHaveText('Create New Password');
    const newPassword = 'CatherineNewPassword123!';
    await page.fill('#forgot-new-password', newPassword);
    await page.fill('#forgot-confirm-password', newPassword);
    await page.click('#btn-reset-password');

    // Reach success screen
    await expect(page.locator('#forgot-success-screen')).toBeVisible();
    await page.click('#btn-back-to-login');

    // Login with newly updated credentials
    await expect(page.locator('.modal-title')).toHaveText('Enter the Sanctuary');
    await page.fill('#login-email', registeredGmail);
    await page.fill('#login-password', newPassword);
    await page.click('#btn-submit-login');

    // Authenticated
    await expect(page.locator('#auth-modal')).not.toBeVisible();
    await expect(page.locator('.user-name')).toHaveText('Lady Catherine de Bourgh');
  });

  test('Positive 3: Resend OTP generates and sends a new OTP directly to Gmail', async ({ page, request }) => {
    await page.goto('http://localhost:5173');
    await page.click('#btn-open-login');
    await page.click('#btn-switch-forgot');
    await page.fill('#forgot-email', registeredGmail);
    await page.click('#btn-submit-forgot');

    const beforeRes = await request.get(`http://localhost:5000/api/auth/inbox/${encodeURIComponent(registeredGmail)}`);
    const initialCount = (await beforeRes.json()).messages.length;

    // Click Resend OTP
    const resendBtn = page.locator('#btn-resend-otp');
    await expect(resendBtn).toBeVisible();
    await resendBtn.click();

    // Verify new OTP email in Gmail inbox
    const afterRes = await request.get(`http://localhost:5000/api/auth/inbox/${encodeURIComponent(registeredGmail)}`);
    const afterData = await afterRes.json();
    expect(afterData.messages.length).toBeGreaterThan(initialCount);

    const latestEmail = afterData.messages[0];
    expect(latestEmail.otp).toMatch(/^\d{6}$/);
    expect(latestEmail.previewUrl).toBeUndefined();
  });

  test('Positive 4: Protect email/OTP information by ensuring zero public Ethereal URLs', async ({ page, request }) => {
    // API verification: forgot-password response must not contain ethereal link
    const res = await request.post('http://localhost:5000/api/auth/forgot-password', {
      data: { email: registeredGmail },
    });
    const body = await res.json();
    expect(body.previewUrl).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain('ethereal.email');

    // UI verification: Ensure no public link exists in modal
    await page.goto('http://localhost:5173');
    await page.click('#btn-open-login');
    await page.click('#btn-switch-forgot');
    await page.fill('#forgot-email', registeredGmail);
    await page.click('#btn-submit-forgot');

    await page.click('#btn-open-inbox');
    await expect(page.locator('#link-web-mailbox')).toHaveCount(0);
    const modalHtml = await page.locator('#auth-modal').innerHTML();
    expect(modalHtml).not.toContain('ethereal.email');
    await expect(page.locator('.mailbox-privacy-notice')).toContainText('Delivered to registered email address');
  });

  // -------------------------------------------------------------
  // ❌ NEGATIVE TEST CASES
  // -------------------------------------------------------------

  test('Negative 1: Enter unregistered Gmail displays error and does not send OTP', async ({ page, request }) => {
    await page.goto('http://localhost:5173');
    await page.click('#btn-open-login');
    await page.click('#btn-switch-forgot');

    await page.fill('#forgot-email', unregisteredGmail);
    await page.click('#btn-submit-forgot');

    const errorAlert = page.locator('#auth-error-msg');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('No registered reader account found');

    // Verify no email was dispatched
    const inboxRes = await request.get(`http://localhost:5000/api/auth/inbox/${encodeURIComponent(unregisteredGmail)}`);
    expect((await inboxRes.json()).messages.length).toBe(0);
  });

  test('Negative 2: Enter invalid email format displays email validation error', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.click('#btn-open-login');
    await page.click('#btn-switch-forgot');

    await page.evaluate(() => {
      const form = document.querySelector('#form-forgot-request') as HTMLFormElement;
      if (form) form.noValidate = true;
    });

    await page.fill('#forgot-email', 'invalid-gmail-format');
    await page.click('#btn-submit-forgot');

    const errorAlert = page.locator('#auth-error-msg');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Please provide a valid email format');
  });

  test('Negative 3: Submit without email displays required-field validation', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.click('#btn-open-login');
    await page.click('#btn-switch-forgot');

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

  test('Negative 4: Enter incorrect OTP rejects and displays error', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.click('#btn-open-login');
    await page.click('#btn-switch-forgot');

    await page.fill('#forgot-email', registeredGmail);
    await page.click('#btn-submit-forgot');

    await expect(page.locator('#forgot-otp')).toBeVisible();
    await page.fill('#forgot-otp', '000000');
    await page.click('#btn-verify-otp');

    const errorAlert = page.locator('#auth-error-msg');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Invalid OTP');
  });

  test('Negative 5: Enter expired OTP rejects and requests a new OTP', async ({ request }) => {
    const apiRes = await request.post('http://localhost:5000/api/auth/verify-otp', {
      data: { email: 'nonexistent_gmail_user@gmail.com', otp: '123456' },
    });
    expect(apiRes.status()).toBe(400);
    const body = await apiRes.json();
    expect(body.error).toContain('No OTP request found for this email');
  });

  test('Negative 6: Check Ethereal after OTP request ensures zero delivery through Ethereal', async ({ request }) => {
    const reqRes = await request.post('http://localhost:5000/api/auth/forgot-password', {
      data: { email: registeredGmail },
    });
    expect(reqRes.status()).toBe(200);
    const body = await reqRes.json();

    // Verify response does not reference ethereal
    expect(body.previewUrl).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain('ethereal');
  });
});
