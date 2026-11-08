/** @file Smoke test that verifies the application shell boots successfully. */
import { expect, test } from '@playwright/test';
import { makeProduct, mockProductsSuccess } from './helpers/api-mock.js';

test('boots the application shell', async ({ page }) => {
  await mockProductsSuccess(page, {
    response: {
      data: [
        makeProduct({ name: 'Desk', slug: 'desk' }),
        makeProduct({ name: 'Chair', slug: 'chair' }),
      ],
      meta: { page: 1, per_page: 12, total: 2, total_pages: 1 },
    },
  });

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
  await expect(page.locator('.product-card')).toHaveCount(2);
  await expect(page.locator('.product-card').first()).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
