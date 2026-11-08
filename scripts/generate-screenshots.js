import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
import {
  buildPagedResponse,
  makeProduct,
  mockProductsError,
  mockProductsSuccess,
} from '../e2e/helpers/api-mock.js';

const PREVIEW_URL = 'http://localhost:4173/';
const OUTPUT_DIRECTORY = new URL('../docs/screenshots/', import.meta.url);

/** @type {Array<[string, number, number, number]>} */
const productDetails = [
  ['Ergonomic office chair', 199.99, 4.8, 12],
  ['Adjustable standing desk', 349.0, 4.6, 5],
  ['Mechanical keyboard', 129.0, 4.9, 28],
  ['Noise-cancelling headphones', 89.99, 4.4, 142],
  ['USB-C hub', 45.0, 4.2, 67],
  ['LED desk lamp', 59.99, 4.7, 34],
  ['Wireless mouse', 39.99, 4.5, 89],
  ['Monitor stand', 79.99, 4.3, 18],
  ['Laptop sleeve', 29.99, 4.1, 56],
  ['Ergonomic footrest', 49.99, 4.0, 23],
  ['Cable organizer', 19.99, 4.6, 41],
  ['Desk pad', 34.99, 4.5, 72],
  ['Gaming chair', 449.0, 4.7, 35],
  ['Portable SSD', 119.0, 4.8, 52],
  ['Webcam', 79.0, 4.3, 21],
  ['Microphone arm', 64.99, 4.4, 16],
  ['Desktop organizer', 39.99, 4.2, 8],
  ['Desk drawer unit', 89.99, 4.1, 11],
];

const products = productDetails.map(([name, price, average_rating, ratings_count]) =>
  makeProduct({
    name,
    slug: name
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/(^-|-$)/g, ''),
    price,
    average_rating,
    ratings_count,
    stock: 25,
    currency: 'USD',
    state: 'published',
  }),
);

/**
 * Waits for the production preview to respond successfully.
 *
 * @param {import('node:child_process').ChildProcess} preview Preview server process.
 * @returns {Promise<void>} Resolves when the preview responds with HTTP 200.
 * @throws {Error} If the server exits or fails to start within 30 seconds.
 */
async function waitForPreview(preview) {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    if (preview.exitCode !== null) {
      throw new Error(`Preview process exited with code ${preview.exitCode}`);
    }

    try {
      const response = await fetch(PREVIEW_URL);
      if (response.status === 200) {
        return;
      }
    } catch {
      // The preview server is not ready yet.
    }

    await delay(200);
  }

  throw new Error('Timed out waiting for the preview server after 30 seconds');
}

/**
 * Waits for fonts and images, then saves a full-page screenshot.
 *
 * @param {import('@playwright/test').Page} page Browser page.
 * @param {string} filename Screenshot filename.
 * @returns {Promise<void>} Resolves after the screenshot is written.
 */
async function captureScreenshot(page, filename) {
  await page.evaluate(() => {
    for (const image of document.images) {
      image.loading = 'eager';
    }
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForFunction(() => [...document.images].every((image) => image.complete));
  await page.screenshot({
    path: new URL(filename, OUTPUT_DIRECTORY).pathname,
    fullPage: true,
  });
}

/**
 * Opens the catalog at a viewport with the successful product fixture installed.
 *
 * @param {import('@playwright/test').Page} page Browser page.
 * @param {{ width: number, height: number }} viewport Viewport dimensions.
 * @returns {Promise<void>} Resolves when the first product page is visible.
 */
async function openCatalog(page, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(PREVIEW_URL);
  await page.locator('.product-card').nth(11).waitFor({ state: 'visible' });
}

/**
 * Generates the documentation screenshots from the production preview.
 *
 * @returns {Promise<void>} Resolves after all nine screenshots are written.
 */
async function main() {
  await mkdir(OUTPUT_DIRECTORY, { recursive: true });

  const preview = spawn('pnpm', ['preview'], { stdio: 'ignore' });
  /** @type {import('@playwright/test').Browser | undefined} */
  let browser;
  let screenshotCount = 0;

  try {
    await waitForPreview(preview);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const desktop = { width: 1280, height: 800 };
    const mobile = { width: 375, height: 812 };
    const tablet = { width: 768, height: 1024 };

    await mockProductsSuccess(page, {
      handler: (params) => buildPagedResponse(products, params),
    });

    await openCatalog(page, desktop);
    await captureScreenshot(page, '01-desktop-default.png');
    screenshotCount += 1;

    await openCatalog(page, desktop);
    await page.locator('#search-bar-input').fill('chair');
    await page.locator('.product-card').nth(1).waitFor({ state: 'visible' });
    await captureScreenshot(page, '02-desktop-search-results.png');
    screenshotCount += 1;

    await openCatalog(page, desktop);
    await page.locator('#search-bar-input').fill('xyz123');
    await page.locator('.state-message--empty').waitFor({ state: 'visible' });
    await captureScreenshot(page, '03-desktop-search-empty.png');
    screenshotCount += 1;

    await openCatalog(page, desktop);
    await page.locator('.pagination__next').click();
    await page.locator('.product-card').nth(5).waitFor({ state: 'visible' });
    await captureScreenshot(page, '04-desktop-page-2.png');
    screenshotCount += 1;

    await page.unroute('**/v1/products*');
    await mockProductsError(page, { status: 500 });
    await page.goto(PREVIEW_URL);
    await page.locator('.state-message--error').waitFor({ state: 'visible' });
    await captureScreenshot(page, '05-desktop-error.png');
    screenshotCount += 1;

    await page.unroute('**/v1/products*');
    await mockProductsSuccess(page, {
      handler: (params) => buildPagedResponse(products, params),
    });
    await openCatalog(page, mobile);
    await captureScreenshot(page, '06-mobile-default.png');
    screenshotCount += 1;

    await openCatalog(page, mobile);
    await page.locator('#search-bar-input').fill('chair');
    await page.locator('.product-card').nth(1).waitFor({ state: 'visible' });
    await captureScreenshot(page, '07-mobile-search-results.png');
    screenshotCount += 1;

    await page.unroute('**/v1/products*');
    await mockProductsError(page, { status: 500 });
    await page.goto(PREVIEW_URL);
    await page.locator('.state-message--error').waitFor({ state: 'visible' });
    await captureScreenshot(page, '08-mobile-error.png');
    screenshotCount += 1;

    await page.unroute('**/v1/products*');
    await mockProductsSuccess(page, {
      handler: (params) => buildPagedResponse(products, params),
    });
    await openCatalog(page, tablet);
    await captureScreenshot(page, '09-tablet-default.png');
    screenshotCount += 1;

    process.stdout.write(`Generated ${screenshotCount} screenshots in docs/screenshots/\n`);
  } finally {
    await browser?.close();
    if (preview.exitCode === null) {
      preview.kill('SIGTERM');
    }
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
