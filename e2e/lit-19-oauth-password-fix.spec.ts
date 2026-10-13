import { test, expect } from '@playwright/test';

test.describe('Issue #19: Fix Google OAuth 400 origin_mismatch and Password Login Authentication Error', () => {
  const testUser = {
    name: 'Eleanor Scholar',
    email: `eleanor_${Date.now()}@literature.org`,
    password: 'ValidPassword123!',
  };

  test.beforeAll(async ({ request }) => {
    // Register test reader account for password login tests
    const regRes = await request.post('http://localhost:5000/api/auth/register', {
      data: {
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
        confirmPassword: testUser.password,
      },
    });
    expect([201, 409]).toContain(regRes.status());
  });

  // ==========================================
  // POSITIVE TEST CASES
  // ==========================================

  test('Positive #1: Google OAuth login - User authenticates successfully and is redirected to application with session', async ({ request, page }) => {
    // 1. Backend server verifies valid Google identity and responds with authenticated session
    const googleAuthRes = await request.post('http://localhost:5000/api/auth/google', {
      data: {
        demoUser: {
          name: 'Verified Google Scholar',
          email: 'google.scholar@literature.org',
          googleId: 'google_oauth_sub_1234567890',
          picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
        },
      },
    });
    expect(googleAuthRes.status()).toBe(200);
    const authData = await googleAuthRes.json();
    expect(authData.token).toBeDefined();
    expect(authData.user.email).toBe('google.scholar@literature.org');
    expect(authData.user.role).toBe('READER');

    // 2. Browser session verification
    await page.goto('http://localhost:5173');
    await page.evaluate((data) => {
      localStorage.setItem('literature_token', data.token);
      localStorage.setItem('literature_user', JSON.stringify(data.user));
    }, authData);
    await page.reload();

    // Verify session badge indicates authenticated scholar
    await expect(page.locator('.user-profile-badge')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.user-name')).toContainText('Verified Google Scholar');
  });

  test('Positive #2: Valid password login - Enter registered email and correct password signs in successfully', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.removeItem('literature_token');
      localStorage.removeItem('literature_user');
    });
    await page.reload();

    // Open login modal
    const signInBtn = page.locator('#btn-open-login, button:has-text("Sign In"), button:has-text("Reader Login")').first();
    await signInBtn.click();
    await expect(page.locator('#auth-modal')).toBeVisible({ timeout: 5000 });

    // Fill valid credentials
    await page.locator('#login-email').fill(testUser.email);
    await page.locator('#login-password').fill(testUser.password);
    await page.locator('#btn-submit-login').click();

    // Verify modal closes and user is authenticated
    await expect(page.locator('#auth-modal')).not.toBeVisible({ timeout: 10000 });
    const storedUser = await page.evaluate(() => localStorage.getItem('literature_user'));
    expect(storedUser).not.toBeNull();
    expect(JSON.parse(storedUser!).email).toBe(testUser.email);
  });

  test('Positive #3: OAuth configuration - Deployed authorized origins are correctly configured', async ({ request }) => {
    const res = await request.get('http://localhost:5000/api/auth/google/config');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('clientId');
    expect(body).toHaveProperty('isConfigured');
    expect(body).toHaveProperty('authorizedOrigins');
    expect(Array.isArray(body.authorizedOrigins)).toBe(true);
    expect(body.authorizedOrigins).toContain('http://localhost:5173');
  });

  test('Positive #4: Login session - Established session persists across page reload', async ({ page, request }) => {
    const loginRes = await request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: testUser.email,
        password: testUser.password,
      },
    });
    expect(loginRes.status()).toBe(200);
    const session = await loginRes.json();

    await page.goto('http://localhost:5173');
    await page.evaluate((s) => {
      localStorage.setItem('literature_token', s.token);
      localStorage.setItem('literature_user', JSON.stringify(s.user));
    }, session);
    await page.reload();

    const token = await page.evaluate(() => localStorage.getItem('literature_token'));
    expect(token).toBe(session.token);
  });

  // ==========================================
  // NEGATIVE TEST CASES
  // ==========================================

  test('Negative #1 & #4: Unauthorized OAuth origin / origin mismatch is rejected with descriptive error', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const signInBtn = page.locator('#btn-open-login, button:has-text("Sign In"), button:has-text("Reader Login")').first();
    await signInBtn.click();
    await expect(page.locator('#auth-modal')).toBeVisible({ timeout: 5000 });

    // Mock Google GIS reporting origin_mismatch
    await page.evaluate(() => {
      (window as any).google = {
        accounts: {
          oauth2: {
            initTokenClient: (config: any) => ({
              requestAccessToken: () => {
                if (config.error_callback) {
                  config.error_callback({
                    message: 'origin_mismatch: Request from unauthorized origin',
                    error: 'origin_mismatch',
                  });
                }
              },
            }),
          },
        },
      };
    });

    await page.locator('#btn-google-auth').click();
    const errorAlert = page.locator('#auth-error-msg');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
    await expect(errorAlert).toContainText('origin_mismatch');
  });

  test('Negative #2: Invalid password - Enter incorrect password rejects login with appropriate message', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const signInBtn = page.locator('#btn-open-login, button:has-text("Sign In"), button:has-text("Reader Login")').first();
    await signInBtn.click();
    await expect(page.locator('#auth-modal')).toBeVisible({ timeout: 5000 });

    await page.locator('#login-email').fill(testUser.email);
    await page.locator('#login-password').fill('IncorrectPassword999!');
    await page.locator('#btn-submit-login').click();

    const errorAlert = page.locator('#auth-error-msg');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
    await expect(errorAlert).toContainText('Invalid email or password');

    // Confirm no token was stored
    const token = await page.evaluate(() => localStorage.getItem('literature_token'));
    expect(token).toBeNull();
  });

  test('Negative #3: Invalid email - Unregistered email rejects access with appropriate message', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const signInBtn = page.locator('#btn-open-login, button:has-text("Sign In"), button:has-text("Reader Login")').first();
    await signInBtn.click();
    await expect(page.locator('#auth-modal')).toBeVisible({ timeout: 5000 });

    await page.locator('#login-email').fill('nonexistent.reader.99999@literature.org');
    await page.locator('#login-password').fill('SomePassword123!');
    await page.locator('#btn-submit-login').click();

    const errorAlert = page.locator('#auth-error-msg');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
    await expect(errorAlert).toContainText('Invalid email or password');
  });

  test('Negative #5: Failed login session - No authenticated session is created on failure', async ({ request }) => {
    const failRes = await request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: 'invalid.user@literature.org',
        password: 'badpassword',
      },
    });
    expect(failRes.status()).toBe(401);
    const body = await failRes.json();
    expect(body.token).toBeUndefined();
    expect(body.user).toBeUndefined();
    expect(body.error).toContain('Invalid email or password');
  });
});
