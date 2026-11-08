/** @typedef {import('./http.js').ApiError} ApiError */
import { getJson } from './http.js';

/** Default number of products requested per page. */
export const DEFAULT_PAGE_SIZE = 12;

/**
 * @typedef {Object} ListProductsOptions
 * @property {number} [page] Page number, starting at one.
 * @property {number} [limit] Number of products per page, from one to one hundred.
 * @property {string} [search] Optional product search text.
 * @property {AbortSignal} [signal] Optional request cancellation signal.
 */

/**
 * Lists products from the public catalog endpoint.
 *
 * @param {ListProductsOptions} [options] Pagination, search, and cancellation options.
 * @returns {Promise<import('../types/product.js').ProductListEnvelope>} The backend response envelope.
 * @throws {RangeError | ApiError} When input is invalid or the request fails.
 */
export async function listProducts({ page, limit, search, signal } = {}) {
  if (page !== undefined && (!Number.isFinite(page) || !Number.isInteger(page) || page < 1)) {
    throw new RangeError('page must be a finite integer greater than or equal to 1');
  }

  if (
    limit !== undefined &&
    (!Number.isFinite(limit) || !Number.isInteger(limit) || limit < 1 || limit > 100)
  ) {
    throw new RangeError('limit must be a finite integer between 1 and 100');
  }

  let trimmedSearch;
  if (search !== undefined) {
    if (typeof search !== 'string') {
      throw new RangeError('search must be a string');
    }

    trimmedSearch = search.trim();
    if (trimmedSearch.length > 200) {
      throw new RangeError('search must be at most 200 characters');
    }
  }

  const query = new URLSearchParams({
    page: String(page ?? 1),
    limit: String(limit ?? DEFAULT_PAGE_SIZE),
  });
  if (trimmedSearch) {
    query.set('search', trimmedSearch);
  }

  const response = await getJson(
    `/v1/products?${query.toString()}`,
    signal !== undefined ? { signal } : {},
  );
  return /** @type {import('../types/product.js').ProductListEnvelope} */ (response);
}
