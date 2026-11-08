/** @file Responsive catalog layout at mobile, tablet, and desktop viewports. */
import { expect, test } from '@playwright/test';
import { makeProduct, mockProductsSuccess } from './helpers/api-mock.js';

const products = Array.from({ length: 6 }, (_, index) =>
  makeProduct({
    name: `Responsive product ${index + 1}`,
    slug: `responsive-product-${index + 1}`,
  }),
);

/**
 * Counts computed CSS grid columns once the product grid is rendered.
 *
 * @param {import('@playwright/test').Page} page Browser page.
 * @returns {Promise<number>} Number of rendered grid columns.
 */
async function getGridColumnCount(page) {
  return page.locator('.product-grid').evaluate((element) => {
    return getComputedStyle(element).gridTemplateColumns.split(' ').length;
  });
}

/**
 * Installs the shared six-product response and navigates to the catalog.
 *
 * @param {import('@playwright/test').Page} page Browser page.
 * @returns {Promise<void>} Resolves after navigation.
 */
async function openCatalog(page) {
  await mockProductsSuccess(page, {
    response: {
      data: products,
      meta: { page: 1, per_page: 12, total: 6, total_pages: 1 },
    },
  });
  await page.goto('/');
  await expect(page.locator('.product-card')).toHaveCount(6);
}

test('renders a single column on mobile (375px)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openCatalog(page);

  expect(await getGridColumnCount(page)).toBe(1);
  await expect(page.locator('.pagination')).toHaveCSS('flex-direction', 'column');
  await expect(page.locator('.app-header')).toBeVisible();
  await expect(page.locator('.app-main')).toBeVisible();
  await expect(page.locator('.app-footer')).toBeVisible();
});

test('renders two columns on tablet (768px)', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await openCatalog(page);

  expect(await getGridColumnCount(page)).toBe(2);
  await expect(page.locator('.app-header')).toBeVisible();
  await expect(page.locator('.app-main')).toBeVisible();
  await expect(page.locator('.app-footer')).toBeVisible();
});

test('renders three columns on desktop (1280px)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openCatalog(page);

  expect(await getGridColumnCount(page)).toBe(3);
  await expect(page.locator('.app-header')).toBeVisible();
  await expect(page.locator('.app-main')).toBeVisible();
  await expect(page.locator('.app-footer')).toBeVisible();
});
