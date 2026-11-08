/** @file User-facing product search, clear, empty-state, and debounce flows. */
import { expect, test } from '@playwright/test';
import { buildPagedResponse, makeProduct, mockProductsSuccess } from './helpers/api-mock.js';

const products = [
  makeProduct({
    name: 'Ergonomic office chair',
    slug: 'ergonomic-office-chair',
    average_rating: 4.5,
    ratings_count: 10,
    stock: 5,
    price: 100,
  }),
  makeProduct({
    name: 'Adjustable standing desk',
    slug: 'adjustable-standing-desk',
    average_rating: 4.5,
    ratings_count: 10,
    stock: 5,
    price: 100,
  }),
  makeProduct({
    name: 'Mechanical keyboard',
    slug: 'mechanical-keyboard',
    average_rating: 4.5,
    ratings_count: 10,
    stock: 5,
    price: 100,
  }),
  makeProduct({
    name: 'Noise-cancelling headphones',
    slug: 'noise-cancelling-headphones',
    average_rating: 4.5,
    ratings_count: 10,
    stock: 5,
    price: 100,
  }),
  makeProduct({
    name: 'USB-C hub',
    slug: 'usb-c-hub',
    average_rating: 4.5,
    ratings_count: 10,
    stock: 5,
    price: 100,
  }),
];

test.beforeEach(async ({ page }) => {
  await mockProductsSuccess(page, {
    handler: (params) => buildPagedResponse(products, params),
  });
});

test('filters products by search query', async ({ page }) => {
  await page.goto('/');
  await page.locator('#search-bar-input').fill('chair');

  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.locator('.product-card')).toContainText('Ergonomic office chair');
});

test('clearing the search restores the full catalog', async ({ page }) => {
  await page.goto('/');
  await page.locator('#search-bar-input').fill('chair');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.locator('.search-bar__clear').click();

  await expect(page.locator('.product-card')).toHaveCount(5);
});

test('shows the empty state for a query with no matches', async ({ page }) => {
  await page.goto('/');
  await page.locator('#search-bar-input').fill('xyznonexistent');

  await expect(page.locator('.state-message--empty')).toBeVisible();
  await expect(page.locator('.product-card')).toHaveCount(0);
});

test('clearing the search from the empty state restores the full catalog', async ({ page }) => {
  await page.goto('/');
  await page.locator('#search-bar-input').fill('xyznonexistent');
  const emptyState = page.locator('.state-message--empty');
  await expect(emptyState).toBeVisible();
  await emptyState.getByRole('button', { name: 'Clear search' }).click();

  await expect(page.locator('.product-card')).toHaveCount(5);
});

test('search is debounced and only fires once for rapid input', async ({ page }) => {
  let callCount = 0;
  let countSearchRequests = false;
  await page.route('**/v1/products*', async (route) => {
    const url = new URL(route.request().url());
    const params = {
      page: Number(url.searchParams.get('page') ?? 1),
      limit: Number(url.searchParams.get('limit') ?? 12),
      search: url.searchParams.get('search') ?? '',
    };
    if (countSearchRequests && params.search === 'chair') {
      callCount += 1;
    }
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPagedResponse(products, params)),
    });
  });

  await page.goto('/');
  await expect(page.locator('.product-card')).toHaveCount(5);
  callCount = 0;
  countSearchRequests = true;
  await page.locator('#search-bar-input').pressSequentially('chair', { delay: 50 });

  await expect(page.locator('.product-card')).toHaveCount(1);
  expect(callCount).toBeLessThanOrEqual(2);
});
