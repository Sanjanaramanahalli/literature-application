import { test, expect } from '@playwright/test';

test.describe('Milestone 2 - LIT-03: Classic Literature Design System & Sticky Header', () => {
  test('Positive: Sticky header renders brand crest, title, and public nav links', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Brand and subtitle
    await expect(page.locator('.brand-title')).toHaveText('ATHENÆUM');
    await expect(page.locator('.brand-subtitle')).toHaveText('CLASSIC LITERATURE');

    // Navigation Links
    await expect(page.locator('#nav-home')).toBeVisible();
    await expect(page.locator('#nav-explore')).toBeVisible();
    await expect(page.locator('#nav-categories')).toBeVisible();
    await expect(page.locator('#nav-search')).toBeVisible();

    // Anonymous visitor state shows Sign In and Create Account buttons
    await expect(page.locator('#btn-open-login')).toBeVisible();
    await expect(page.locator('#btn-open-register')).toBeVisible();
    await expect(page.locator('#nav-admin')).not.toBeVisible();
  });

  test('Positive: Header maintains sticky positioning during scroll', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const header = page.locator('#main-header');
    const position = await header.evaluate((el) => window.getComputedStyle(el).position);
    expect(position).toBe('sticky');
  });

  test('Positive: Mobile view switches to responsive toggle menu', async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 800 });
    await page.goto('http://localhost:5173');

    const toggle = page.locator('.mobile-toggle');
    await expect(toggle).toBeVisible();

    // Click toggle to open drawer
    await toggle.click();
    await expect(page.locator('#mobile-menu')).toBeVisible();
  });
});
