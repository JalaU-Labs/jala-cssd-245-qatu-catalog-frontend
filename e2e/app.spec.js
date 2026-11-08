/** @file Smoke test that verifies the application shell boots successfully. */
import { expect, test } from '@playwright/test';

test('boots the application shell', async ({ page }) => {
  /** @type {string[]} */
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await page.goto('/');

  await expect(page).toHaveTitle('Qatu Marketplace — Catalog');
  await expect(page.locator('#app')).toHaveAttribute('data-ready', 'true');
  expect(consoleErrors).toEqual([]);
});
