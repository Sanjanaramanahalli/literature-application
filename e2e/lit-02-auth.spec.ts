import { test, expect } from '@playwright/test';

test.describe('Milestone 1 - LIT-02: Authentication & Role-Based Access Control', () => {
  const uniqueEmail = `scholar_${Date.now()}@literature.org`;

  test('Positive: Reader registration with valid credentials succeeds', async ({ request }) => {
    const res = await request.post('http://localhost:5000/api/auth/register', {
      data: {
        name: 'Arthur Pendelton',
        email: uniqueEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.user.role).toBe('READER');
    expect(body.token).toBeDefined();
  });

  test('Negative: Duplicate registration email returns 409 Conflict', async ({ request }) => {
    const res = await request.post('http://localhost:5000/api/auth/register', {
      data: {
        name: 'Duplicate Arthur',
        email: uniqueEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      },
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('already exists');
  });

  test('Positive: Admin registration with valid Admin Invitation Secret assigns ADMIN role', async ({ request }) => {
    const res = await request.post('http://localhost:5000/api/auth/register', {
      data: {
        name: 'Professor Hastings',
        email: `admin_${Date.now()}@literature.org`,
        password: 'AdminPassword123!',
        confirmPassword: 'AdminPassword123!',
        adminSecret: 'LITERATURE_ADMIN_MASTER_KEY_2026',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.user.role).toBe('ADMIN');
  });

  test('Negative: Registration with invalid Admin Invitation Secret returns 403 Forbidden', async ({ request }) => {
    const res = await request.post('http://localhost:5000/api/auth/register', {
      data: {
        name: 'Impostor Admin',
        email: `fake_admin_${Date.now()}@literature.org`,
        password: 'AdminPassword123!',
        confirmPassword: 'AdminPassword123!',
        adminSecret: 'WRONG_UNAUTHORIZED_KEY',
      },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Invalid Admin Invitation Secret key');
  });

  test('Positive: Login with correct credentials returns JWT token', async ({ request }) => {
    const res = await request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: 'admin@literature.org',
        password: 'AdminPassword123!',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.user.role).toBe('ADMIN');
    expect(body.token).toBeDefined();
  });

  test('Negative: Login with incorrect password returns 401 Unauthorized', async ({ request }) => {
    const res = await request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: 'admin@literature.org',
        password: 'WrongPassword!',
      },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Invalid email or password');
  });

  test('Positive: Google OAuth Demo fallback authenticates seamlessly', async ({ request }) => {
    const res = await request.post('http://localhost:5000/api/auth/google', {
      data: {
        demoUser: {
          name: 'Lady Catherine de Bourgh',
          email: 'lady.catherine@gmail.com',
        },
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe('lady.catherine@gmail.com');
    expect(body.token).toBeDefined();
  });
});
