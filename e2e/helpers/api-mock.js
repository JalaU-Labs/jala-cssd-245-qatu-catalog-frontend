/** @typedef {import('../../src/types/product.js').Product} Product */
/** @typedef {import('../../src/types/product.js').ProductListEnvelope} ProductListEnvelope */
/** @typedef {import('@playwright/test').Page} Page */

/** @type {number} */
let nextProductId = 1;

/**
 * Creates a deterministic product fixture with valid product fields.
 *
 * @param {Partial<Product>} [overrides] Product fields to override.
 * @returns {Product} A complete product fixture.
 */
export function makeProduct(overrides = {}) {
  /** @type {Product} */
  const product = {
    id: `00000000-0000-4000-8000-${(nextProductId++).toString().padStart(12, '0')}`,
    seller_id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    category_id: 'b2d3c4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    name: 'Test product',
    slug: 'test-product',
    description: null,
    price: 99.99,
    currency: 'USD',
    stock: 10,
    attributes: {},
    primary_image_path: null,
    state: 'published',
    average_rating: 4.5,
    ratings_count: 10,
    published_at: '2026-10-10T14:30:00.000Z',
    created_at: '2026-10-09T08:00:00.000Z',
    updated_at: '2026-10-10T14:30:00.000Z',
  };

  return { ...product, ...overrides };
}

/**
 * @typedef {Object} ProductsSuccessOptions
 * @property {(params: { page: number, limit: number, search: string }) => ProductListEnvelope} [handler] Dynamic response body factory.
 * @property {ProductListEnvelope} [response] Static response body.
 * @property {number} [delayMs] Optional response delay in milliseconds.
 */

/**
 * Installs a successful product-list route mock.
 *
 * @param {Page} page Playwright page to configure.
 * @param {ProductsSuccessOptions} [options] Response body or factory and optional delay.
 * @returns {Promise<void>} Resolves when the route is installed.
 */
export async function mockProductsSuccess(page, options = {}) {
  await page.route('**/v1/products*', async (route) => {
    const url = new URL(route.request().url());
    const params = {
      page: Number(url.searchParams.get('page') ?? 1),
      limit: Number(url.searchParams.get('limit') ?? 12),
      search: url.searchParams.get('search') ?? '',
    };
    const response = options.handler?.(params) ??
      options.response ?? {
        data: [],
        meta: { page: 1, per_page: 12, total: 0, total_pages: 0 },
      };

    if (options.delayMs !== undefined && options.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    }

    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    });
  });
}

/**
 * @typedef {Object} ProductsErrorOptions
 * @property {number} [status] HTTP status code.
 * @property {Record<string, unknown>} [body] Error response body.
 */

/**
 * Installs a failed product-list route mock.
 *
 * @param {Page} page Playwright page to configure.
 * @param {ProductsErrorOptions} [options] HTTP status and response body.
 * @returns {Promise<void>} Resolves when the route is installed.
 */
export async function mockProductsError(page, options = {}) {
  const body = options.body ?? {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred.',
    },
    meta: { timestamp: '2026-10-14T12:00:00.000Z' },
  };

  await page.route('**/v1/products*', async (route) => {
    await route.fulfill({
      status: options.status ?? 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  });
}

/**
 * Installs a product-list route that simulates a network failure.
 *
 * @param {Page} page Playwright page to configure.
 * @returns {Promise<void>} Resolves when the route is installed.
 */
export async function mockProductsNetworkError(page) {
  await page.route('**/v1/products*', (route) => route.abort('failed'));
}

/**
 * Filters and paginates products into the API response envelope.
 *
 * @param {Product[]} allProducts Complete product collection.
 * @param {{ page: number, limit: number, search: string }} params Pagination and search parameters.
 * @returns {ProductListEnvelope} The filtered page and pagination metadata.
 */
export function buildPagedResponse(allProducts, { page, limit, search }) {
  const normalizedSearch = search.toLocaleLowerCase();
  const matchingProducts = normalizedSearch
    ? allProducts.filter((product) => product.name.toLocaleLowerCase().includes(normalizedSearch))
    : allProducts;
  const total = matchingProducts.length;
  const start = (page - 1) * limit;

  return {
    data: matchingProducts.slice(start, start + limit),
    meta: {
      page,
      per_page: limit,
      total,
      total_pages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}
