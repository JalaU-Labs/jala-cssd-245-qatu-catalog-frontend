/** @file Product catalog error handling and recovery flows. */
import { expect, test } from '@playwright/test';
import {
  makeProduct,
  mockProductsError,
  mockProductsNetworkError,
  mockProductsSuccess,
} from './helpers/api-mock.js';

test('shows the error state and recovers with Retry', async ({ page }) => {
  await mockProductsError(page, { status: 500 });
  await page.goto('/');
  const errorState = page.locator('.state-message--error');
  await expect(errorState).toBeVisible();
  await expect(errorState.getByRole('button', { name: 'Retry' })).toBeVisible();

  await page.unroute('**/v1/products*');
  await mockProductsSuccess(page, {
    response: {
      data: [makeProduct()],
      meta: { page: 1, per_page: 12, total: 1, total_pages: 1 },
    },
  });
  await errorState.getByRole('button', { name: 'Retry' }).click();

  await expect(page.locator('.product-card')).toHaveCount(1);
});

test('shows the error state on network failure', async ({ page }) => {
  await mockProductsNetworkError(page);
  await page.goto('/');

  const errorState = page.locator('.state-message--error');
  await expect(errorState).toBeVisible();
  await expect(errorState).toContainText('Something went wrong');
});
