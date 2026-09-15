import { test, expect } from '@playwright/test';

test.describe('Milestone 3 - LIT-08: 2-Level Threaded Comments & Cascade Deletion System', () => {
  test('Guard / Negative: Anonymous visitor cannot submit comment and is prompted to sign in', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page.locator('#main-header')).toBeVisible({ timeout: 15000 });

    // Open first manuscript
    const card = page.locator('[data-testid="literature-card"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();

    await expect(page.locator('#reader-view-container')).toBeVisible({ timeout: 10000 });

    // Verify guest hint is displayed
    const guestHint = page.locator('#guest-comment-hint');
    await expect(guestHint).toBeVisible();

    // Click sign in from comments
    await guestHint.locator('span').click();

    // Verify Auth Modal appears
    const authModal = page.locator('#auth-modal');
    await expect(authModal).toBeVisible({ timeout: 5000 });
    await expect(authModal.locator('.modal-title')).toContainText('Enter the Sanctuary');
  });

  test('Positive & Cascade Deletion: Readers post top-level comment, 1-level reply, and parent deletion cascades', async ({ page }) => {
    const timestamp = Date.now();
    const authorEmail = `author_${timestamp}@literature.org`;
    const replierEmail = `replier_${timestamp}@literature.org`;
    const scholarPassword = 'ScholarPassword123!';
    const uniqueCommentText = `Contemplation on ethics and destiny #${timestamp}`;
    const uniqueReplyText = `Seneca agrees with contemplation #${timestamp}`;

    await page.goto('http://localhost:5173');
    await expect(page.locator('#main-header')).toBeVisible({ timeout: 15000 });

    // 1. Register Author Reader
    const registerBtn = page.locator('#btn-open-register');
    await expect(registerBtn).toBeVisible({ timeout: 10000 });
    await registerBtn.click();

    await page.fill('#reg-name', 'Diogenes Thinker');
    await page.fill('#reg-email', authorEmail);
    await page.fill('#reg-password', scholarPassword);
    await page.fill('#reg-confirm', scholarPassword);
    await page.click('#btn-submit-register');

    await expect(page.locator('#active-user-banner')).toBeVisible({ timeout: 10000 });

    // 2. Open first manuscript
    const card = page.locator('[data-testid="literature-card"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();
    await expect(page.locator('#reader-view-container')).toBeVisible({ timeout: 10000 });

    // 3. Post top-level comment
    const topInput = page.locator('#input-top-comment');
    await expect(topInput).toBeVisible();
    await topInput.fill(uniqueCommentText);
    await page.click('#btn-submit-top-comment');

    // Verify comment appears in the tree
    const commentCard = page.locator(`[data-testid="comment-card"]:has-text("${uniqueCommentText}")`);
    await expect(commentCard).toBeVisible({ timeout: 10000 });

    // 4. Log out and return to home catalog
    await page.click('#btn-logout');
    await expect(page.locator('#btn-open-login')).toBeVisible({ timeout: 10000 });
    await page.click('#btn-reader-back');
    await expect(page.locator('#catalog-view')).toBeVisible({ timeout: 10000 });

    // 5. Register second reader (Replier)
    await page.click('#btn-open-register');
    await page.fill('#reg-name', 'Seneca Observer');
    await page.fill('#reg-email', replierEmail);
    await page.fill('#reg-password', scholarPassword);
    await page.fill('#reg-confirm', scholarPassword);
    await page.click('#btn-submit-register');

    await expect(page.locator('#active-user-banner')).toBeVisible({ timeout: 10000 });

    // 6. Open the same work
    const secondCard = page.locator('[data-testid="literature-card"]').first();
    await expect(secondCard).toBeVisible({ timeout: 10000 });
    await secondCard.click();
    await expect(page.locator('#reader-view-container')).toBeVisible({ timeout: 10000 });

    // Click reply trigger on Diogenes' comment
    const targetComment = page.locator(`[data-testid="comment-card"]:has-text("${uniqueCommentText}")`);
    await expect(targetComment).toBeVisible();
    const replyTrigger = targetComment.locator('[data-testid="btn-reply-trigger"]');
    await expect(replyTrigger).toBeVisible();
    await replyTrigger.click();

    // Fill direct reply
    const replyTextarea = page.locator('.reply-textarea').first();
    await expect(replyTextarea).toBeVisible();
    await replyTextarea.fill(uniqueReplyText);

    // Submit reply
    const postReplyBtn = page.locator('.reply-editor-actions button:has-text("Post Reply")').first();
    await postReplyBtn.click();

    // Verify 1-level deep reply rendered
    const replyCard = page.locator(`[data-testid="reply-card"]:has-text("${uniqueReplyText}")`);
    await expect(replyCard).toBeVisible({ timeout: 10000 });

    // 7. Seneca (non-author) should NOT see delete button for Diogenes' parent comment
    await expect(targetComment.locator('[data-testid="btn-delete-comment"]')).toHaveCount(0);

    // 8. Seneca CAN delete their own reply
    const deleteReplyBtn = replyCard.locator('[data-testid="btn-delete-reply"]');
    await expect(deleteReplyBtn).toBeVisible();

    // 9. Now test cascade deletion: switch back to author Diogenes
    await page.click('#btn-logout');
    await expect(page.locator('#btn-open-login')).toBeVisible({ timeout: 10000 });

    await page.click('#btn-open-login');
    await page.fill('#login-email', authorEmail);
    await page.fill('#login-password', scholarPassword);
    await page.click('#btn-submit-login');
    await expect(page.locator('#active-user-banner')).toBeVisible({ timeout: 10000 });

    // Target the specific comment authored by Diogenes
    const authorCommentCard = page.locator(`[data-testid="comment-card"]:has-text("${uniqueCommentText}")`);
    await expect(authorCommentCard).toBeVisible({ timeout: 10000 });
    const deleteParentBtn = authorCommentCard.locator('[data-testid="btn-delete-comment"]');
    await expect(deleteParentBtn).toBeVisible({ timeout: 10000 });
    await deleteParentBtn.click();

    // Confirm that Diogenes' comment AND Seneca's nested reply are both cascade deleted from the DOM
    await expect(page.locator(`[data-testid="comment-card"]:has-text("${uniqueCommentText}")`)).toHaveCount(0);
    await expect(page.locator(`[data-testid="reply-card"]:has-text("${uniqueReplyText}")`)).toHaveCount(0);
  });
});
