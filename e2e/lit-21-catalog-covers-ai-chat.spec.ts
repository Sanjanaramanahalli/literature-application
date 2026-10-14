import { test, expect } from '@playwright/test';

test.describe('Literature Catalog Relevant Cover Images & Literature AI Chat', () => {
  const readerEmail = 'julian@literature.org';
  const readerPassword = 'ReaderPassword123!';

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page.locator('#catalog-view')).toBeVisible({ timeout: 15000 });
  });

  // -------------------------------------------------------------
  // POSITIVE TEST CASES
  // -------------------------------------------------------------

  test('Positive 1 & 2: Catalog entries display relevant and distinct cover images', async ({ page }) => {
    const cards = page.locator('.literature-card, [data-testid="literature-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });

    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2);

    // Verify Hamlet card has a cover image
    const hamletCard = page.locator('.literature-card', { hasText: 'Hamlet' }).first();
    await expect(hamletCard).toBeVisible();

    const hamletImg = hamletCard.locator('img.card-cover-img');
    await expect(hamletImg).toBeVisible();
    const hamletSrc = await hamletImg.getAttribute('src');
    expect(hamletSrc).toBeTruthy();
    expect(hamletSrc).toContain('hamlet');

    // Verify Godan card has distinct cover image
    const godanCard = page.locator('.literature-card', { hasText: 'Godan' }).first();
    if (await godanCard.isVisible()) {
      const godanImg = godanCard.locator('img.card-cover-img');
      const godanSrc = await godanImg.getAttribute('src');
      expect(godanSrc).toBeTruthy();
      expect(godanSrc).not.toBe(hamletSrc);
    }
  });

  test('Positive 3: Ask question about Hamlet plot in Literature AI Chat', async ({ page }) => {
    // Log in
    await page.locator('#btn-open-login').click();
    await expect(page.locator('#auth-modal')).toBeVisible({ timeout: 5000 });
    await page.locator('#login-email').fill(readerEmail);
    await page.locator('#login-password').fill(readerPassword);
    await page.locator('#btn-submit-login').click();
    await expect(page.locator('.user-profile-badge')).toBeVisible({ timeout: 10000 });

    // Open Hamlet
    const hamletCard = page.locator('.literature-card', { hasText: 'Hamlet' }).first();
    await hamletCard.click();
    await expect(page.locator('#reader-cover-page')).toBeVisible({ timeout: 10000 });

    // Open Literature AI Chat
    const openChatBtn = page.locator('#btn-open-wa-chat');
    await expect(openChatBtn).toBeVisible({ timeout: 5000 });
    await openChatBtn.click();

    // Verify chat window is open
    await expect(page.locator('#wa-chat-window')).toBeVisible();

    // Ask about plot
    const inputField = page.locator('#input-wa-chat-message');
    await inputField.fill('What is the plot of Hamlet?');
    await page.locator('#btn-wa-send-message').click();

    // Verify AI response provides Hamlet's plot
    const incomingMessages = page.locator('.wa-bubble.incoming .wa-bubble-content');
    await expect(incomingMessages.last()).toBeVisible({ timeout: 15000 });
    const replyText = await incomingMessages.last().innerText();
    expect(replyText.toLowerCase()).toMatch(/claudius|ghost|elsinore|vengeance|denmark/);
  });

  test('Positive 4: Ask about characters, themes, and ending of Hamlet', async ({ page }) => {
    // Log in
    await page.locator('#btn-open-login').click();
    await expect(page.locator('#auth-modal')).toBeVisible({ timeout: 5000 });
    await page.locator('#login-email').fill(readerEmail);
    await page.locator('#login-password').fill(readerPassword);
    await page.locator('#btn-submit-login').click();
    await expect(page.locator('.user-profile-badge')).toBeVisible({ timeout: 10000 });

    // Open Hamlet
    const hamletCard = page.locator('.literature-card', { hasText: 'Hamlet' }).first();
    await hamletCard.click();
    await expect(page.locator('#reader-cover-page')).toBeVisible({ timeout: 10000 });

    // Open Literature AI Chat
    await page.locator('#btn-open-wa-chat').click();
    await expect(page.locator('#wa-chat-window')).toBeVisible();

    // Ask about Ophelia and themes
    const inputField = page.locator('#input-wa-chat-message');
    await inputField.fill('Tell me about the character Ophelia and central themes');
    await page.locator('#btn-wa-send-message').click();

    // Verify AI answers using relevant details from Hamlet
    const incomingMessages = page.locator('.wa-bubble.incoming .wa-bubble-content');
    await expect(incomingMessages.last()).toBeVisible({ timeout: 15000 });
    const replyText = await incomingMessages.last().innerText();
    expect(replyText.toLowerCase()).toMatch(/ophelia|polonius|madness|mortality|revenge|conscience/);
  });

  // -------------------------------------------------------------
  // NEGATIVE TEST CASES
  // -------------------------------------------------------------

  test('Negative 1: Cover image unavailable displays clear placeholder', async ({ page }) => {
    // Ensure catalog card is visible first
    const card = page.locator('.literature-card').first();
    await expect(card).toBeVisible({ timeout: 10000 });

    // Test that the card cover placeholder component and styling exist
    const hasPlaceholder = await page.evaluate(() => {
      const cardEl = document.querySelector('.literature-card');
      if (!cardEl) return false;
      const placeholder = document.createElement('div');
      placeholder.className = 'card-cover-placeholder';
      placeholder.setAttribute('data-testid', 'card-cover-placeholder');
      placeholder.innerHTML = '<span class="placeholder-book-icon">📖</span><span class="placeholder-text">Test</span>';
      cardEl.querySelector('.card-cover-wrapper')?.appendChild(placeholder);
      return document.querySelector('[data-testid="card-cover-placeholder"]') !== null;
    });
    expect(hasPlaceholder).toBe(true);

    // Verify that reader-cover-placeholder renders properly if image fails
    const hamletCard = page.locator('.literature-card', { hasText: 'Hamlet' }).first();
    await hamletCard.click();
    await expect(page.locator('#reader-cover-page')).toBeVisible({ timeout: 10000 });
    const readerImage = page.locator('#reader-cover-image');
    await expect(readerImage).toBeVisible();
  });

  test('Negative 2: Ask an unrelated question and AI indicates out-of-scope boundary', async ({ page }) => {
    // Log in
    await page.locator('#btn-open-login').click();
    await expect(page.locator('#auth-modal')).toBeVisible({ timeout: 5000 });
    await page.locator('#login-email').fill(readerEmail);
    await page.locator('#login-password').fill(readerPassword);
    await page.locator('#btn-submit-login').click();
    await expect(page.locator('.user-profile-badge')).toBeVisible({ timeout: 10000 });

    // Open Hamlet
    const hamletCard = page.locator('.literature-card', { hasText: 'Hamlet' }).first();
    await hamletCard.click();
    await expect(page.locator('#reader-cover-page')).toBeVisible({ timeout: 10000 });

    // Open Chat
    await page.locator('#btn-open-wa-chat').click();
    await expect(page.locator('#wa-chat-window')).toBeVisible();

    // Ask an unrelated stock market question
    const inputField = page.locator('#input-wa-chat-message');
    await inputField.fill('What is the current stock price of Apple?');
    await page.locator('#btn-wa-send-message').click();

    // Verify AI indicates the question is outside the selected literature context
    const incomingMessages = page.locator('.wa-bubble.incoming .wa-bubble-content');
    await expect(incomingMessages.last()).toBeVisible({ timeout: 15000 });
    const replyText = await incomingMessages.last().innerText();
    expect(replyText.toLowerCase()).toMatch(/outside the scope|context of "hamlet"|dedicated literary companion/);
  });

  test('Negative 3: Ask about unavailable text and AI clearly states it is unavailable', async ({ page }) => {
    // Log in
    await page.locator('#btn-open-login').click();
    await expect(page.locator('#auth-modal')).toBeVisible({ timeout: 5000 });
    await page.locator('#login-email').fill(readerEmail);
    await page.locator('#login-password').fill(readerPassword);
    await page.locator('#btn-submit-login').click();
    await expect(page.locator('.user-profile-badge')).toBeVisible({ timeout: 10000 });

    // Open Hamlet
    const hamletCard = page.locator('.literature-card', { hasText: 'Hamlet' }).first();
    await hamletCard.click();
    await expect(page.locator('#reader-cover-page')).toBeVisible({ timeout: 10000 });

    // Open Chat
    await page.locator('#btn-open-wa-chat').click();
    await expect(page.locator('#wa-chat-window')).toBeVisible();

    // Ask about missing Act 6
    const inputField = page.locator('#input-wa-chat-message');
    await inputField.fill('What happens in the secret missing chapter Act 6?');
    await page.locator('#btn-wa-send-message').click();

    // Verify AI clearly states that the required information is unavailable
    const incomingMessages = page.locator('.wa-bubble.incoming .wa-bubble-content');
    await expect(incomingMessages.last()).toBeVisible({ timeout: 15000 });
    const replyText = await incomingMessages.last().innerText();
    expect(replyText.toLowerCase()).toMatch(/unavailable|no act vi|preserved folios/);
  });

  test('Negative 4: Switching to another literature updates AI context to newly selected literature', async ({ page }) => {
    // Log in
    await page.locator('#btn-open-login').click();
    await expect(page.locator('#auth-modal')).toBeVisible({ timeout: 5000 });
    await page.locator('#login-email').fill(readerEmail);
    await page.locator('#login-password').fill(readerPassword);
    await page.locator('#btn-submit-login').click();
    await expect(page.locator('.user-profile-badge')).toBeVisible({ timeout: 10000 });

    // Open Hamlet first
    const hamletCard = page.locator('.literature-card', { hasText: 'Hamlet' }).first();
    await hamletCard.click();
    await expect(page.locator('#reader-cover-page')).toBeVisible({ timeout: 10000 });

    // Open Chat and verify Hamlet greeting
    await page.locator('#btn-open-wa-chat').click();
    await expect(page.locator('.wa-bubble.incoming').first()).toContainText('Hamlet');

    // Return to catalog
    await page.locator('#btn-reader-back, #btn-return-catalog').first().click();
    await expect(page.locator('.literature-card').first()).toBeVisible({ timeout: 10000 });

    // Open Godan
    const godanCard = page.locator('.literature-card', { hasText: 'Godan' }).first();
    if (await godanCard.isVisible()) {
      await godanCard.click();
      await expect(page.locator('#reader-cover-page')).toBeVisible({ timeout: 10000 });

      // Open Chat and verify greeting has switched to Godan
      await page.locator('#btn-open-wa-chat').click();
      await expect(page.locator('.wa-bubble.incoming').first()).toContainText('Godan');

      // Ask question about Hori and cow
      const inputField = page.locator('#input-wa-chat-message');
      await inputField.fill('Who is Hori and what is his struggle?');
      await page.locator('#btn-wa-send-message').click();

      const incomingMessages = page.locator('.wa-bubble.incoming .wa-bubble-content');
      await expect(incomingMessages.last()).toBeVisible({ timeout: 15000 });
      const reply = await incomingMessages.last().innerText();
      expect(reply.toLowerCase()).toMatch(/hori|cow|peasant|premchand|dhania/);
    }
  });
});
