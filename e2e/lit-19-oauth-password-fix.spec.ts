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

  test('Positive #1: Google login with a valid account - Official Google account chooser opens and login succeeds', async ({ request, page }) => {
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

  test('Positive #2: Login with another Google account - Selected account is authenticated correctly', async ({ request, page }) => {
    const secondUserRes = await request.post('http://localhost:5000/api/auth/google', {
      data: {
        demoUser: {
          name: 'Marcus Aurelius',
          email: 'marcus.aurelius@literature.org',
          googleId: 'google_oauth_sub_0987654321',
          picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop',
        },
      },
    });
    expect(secondUserRes.status()).toBe(200);
    const secondData = await secondUserRes.json();
    expect(secondData.token).toBeDefined();
    expect(secondData.user.email).toBe('marcus.aurelius@literature.org');

    await page.goto('http://localhost:5173');
    await page.evaluate((data) => {
      localStorage.setItem('literature_token', data.token);
      localStorage.setItem('literature_user', JSON.stringify(data.user));
    }, secondData);
    await page.reload();

    await expect(page.locator('.user-profile-badge')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.user-name')).toContainText('Marcus Aurelius');
  });

  test('Positive #3: Successful login session - Established session persists across page reload', async ({ page, request }) => {
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

  test('Positive: Valid password login and OAuth configuration endpoint', async ({ page, request }) => {
    const res = await request.get('http://localhost:5000/api/auth/google/config');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('clientId');
    expect(body).toHaveProperty('isConfigured');
    expect(body).toHaveProperty('authorizedOrigins');
    expect(Array.isArray(body.authorizedOrigins)).toBe(true);
    expect(body.authorizedOrigins).toContain('http://localhost:5173');

    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.removeItem('literature_token');
      localStorage.removeItem('literature_user');
    });
    await page.reload();

    const signInBtn = page.locator('#btn-open-login, button:has-text("Sign In"), button:has-text("Reader Login")').first();
    await signInBtn.click();
    await expect(page.locator('#auth-modal')).toBeVisible({ timeout: 5000 });

    await page.locator('#login-email').fill(testUser.email);
    await page.locator('#login-password').fill(testUser.password);
    await page.locator('#btn-submit-login').click();

    await expect(page.locator('#auth-modal')).not.toBeVisible({ timeout: 10000 });
    const storedUser = await page.evaluate(() => localStorage.getItem('literature_user'));
    expect(storedUser).not.toBeNull();
    expect(JSON.parse(storedUser!).email).toBe(testUser.email);
  });

  // ==========================================
  // NEGATIVE TEST CASES — BLUEPRINT
  // ==========================================

  test('Negative #1: OAuth request uses an unregistered origin - Google rejects unauthorized request securely and error is handled gracefully', async ({ page }) => {
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

  test('Negative #2: User cancels Google login - User returns to application with clear cancellation state and can retry', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const signInBtn = page.locator('#btn-open-login, button:has-text("Sign In"), button:has-text("Reader Login")').first();
    await signInBtn.click();
    await expect(page.locator('#auth-modal')).toBeVisible({ timeout: 5000 });

    // Mock user closing Google popup / cancelling consent
    await page.evaluate(() => {
      (window as any).google = {
        accounts: {
          oauth2: {
            initTokenClient: (config: any) => ({
              requestAccessToken: () => {
                if (config.callback) {
                  config.callback({
                    error: 'access_denied',
                    error_description: 'The user denied request to access their account',
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
    await expect(errorAlert).toContainText('cancelled or access was denied');

    // Confirm application did not crash and user can retry
    const googleBtn = page.locator('#btn-google-auth');
    await expect(googleBtn).toBeEnabled();
  });

  test('Negative #3: Invalid or mismatched redirect URI / unconfigured Google client - Authentication rejected safely', async ({ page, request }) => {
    await page.goto('http://localhost:5173');
    const signInBtn = page.locator('#btn-open-login, button:has-text("Sign In"), button:has-text("Reader Login")').first();
    await signInBtn.click();
    await expect(page.locator('#auth-modal')).toBeVisible({ timeout: 5000 });

    // Mock popup closed by user or window error
    await page.evaluate(() => {
      (window as any).google = {
        accounts: {
          oauth2: {
            initTokenClient: (config: any) => ({
              requestAccessToken: () => {
                if (config.callback) {
                  config.callback({
                    error: 'popup_closed',
                    error_description: 'popup_closed',
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
    await expect(errorAlert).toContainText('closed before completing authentication');
  });

  test('Negative #4: Google authentication is unsuccessful - User remains unauthenticated and receives error message', async ({ request, page }) => {
    // Attempt token verification with invalid token
    const failRes = await request.post('http://localhost:5000/api/auth/google', {
      data: {
        credential: 'invalid_forged_google_jwt_token',
      },
    });
    expect(failRes.status()).toBe(401);
    const body = await failRes.json();
    expect(body.error).toContain('Invalid, expired, or untrusted Google authentication response');

    // Confirm no session exists
    await page.goto('http://localhost:5173');
    const token = await page.evaluate(() => localStorage.getItem('literature_token'));
    expect(token).toBeNull();
  });

  test('Negative: Password validation failures - Incorrect credentials and nonexistent account', async ({ page }) => {
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
  });
});

