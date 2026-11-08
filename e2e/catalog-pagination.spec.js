/** @file User-facing page-based product pagination flows. */
import { expect, test } from '@playwright/test';
import { buildPagedResponse, makeProduct, mockProductsSuccess } from './helpers/api-mock.js';

const products = Array.from({ length: 30 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0');
  return makeProduct({
    name: `Product ${number}`,
    slug: `product-${number}`,
  });
});

test.beforeEach(async ({ page }) => {
  await mockProductsSuccess(page, {
    handler: (params) => buildPagedResponse(products, params),
  });
  await page.goto('/');
});

test('shows the first page with Previous disabled', async ({ page }) => {
  await expect(page.locator('.product-card')).toHaveCount(12);
  await expect(page.locator('.pagination__prev')).toBeDisabled();
  await expect(page.locator('.pagination__next')).toBeEnabled();
  await expect(page.locator('.pagination__summary')).toContainText('Page 1 of 3 — 30 products');
});

test('navigates to page 2 with Next', async ({ page }) => {
  await page.locator('.pagination__next').click();

  await expect(page.locator('.product-card')).toHaveCount(12);
  await expect(page.locator('.product-card__name').first()).toHaveText('Product 13');
  await expect(page.locator('.pagination__summary')).toContainText('Page 2 of 3');
});

test('returns to page 1 with Previous', async ({ page }) => {
  await page.locator('.pagination__next').click();
  await expect(page.locator('.pagination__summary')).toContainText('Page 2 of 3');
  await page.locator('.pagination__prev').click();

  await expect(page.locator('.product-card__name').first()).toHaveText('Product 01');
  await expect(page.locator('.pagination__summary')).toContainText('Page 1 of 3');
});

test('Next is disabled on the last page', async ({ page }) => {
  await page.locator('.pagination__next').click();
  await page.locator('.pagination__next').click();

  await expect(page.locator('.product-card')).toHaveCount(6);
  await expect(page.locator('.pagination__next')).toBeDisabled();
  await expect(page.locator('.pagination__summary')).toContainText('Page 3 of 3');
});

test('a new search resets pagination to page 1', async ({ page }) => {
  await page.locator('.pagination__next').click();
  await expect(page.locator('.pagination__summary')).toContainText('Page 2 of 3');
  await page.locator('#search-bar-input').fill('Product 01');

  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.locator('.pagination__summary')).toContainText('Page 1 of 1');
  await expect(page.locator('.pagination__prev')).toBeDisabled();
  await expect(page.locator('.pagination__next')).toBeDisabled();
});
