import { listProducts } from '../api/products.js';

/** Default number of products requested per page. */
export const DEFAULT_PAGE_SIZE = 12;

/**
 * @typedef {Object} CatalogState
 * @property {number} page Current page number, at least one.
 * @property {number} limit Page size between one and one hundred.
 * @property {string} search Trimmed search term or an empty string.
 * @property {'idle' | 'loading' | 'success' | 'error'} status Current request status.
 * @property {import('../types/product.js').Product[]} products Current page of products.
 * @property {import('../types/product.js').PaginationMeta} meta Pagination metadata.
 * @property {{ code: string, message: string } | null} error Current request error, if any.
 */

/**
 * @typedef {Object} CatalogStoreOptions
 * @property {(options: { page: number, limit: number, search: string | undefined, signal: AbortSignal }) => Promise<import('../types/product.js').ProductListEnvelope>} [fetcher] Product-list request function.
 * @property {number} [initialLimit=DEFAULT_PAGE_SIZE] Initial page size from one to one hundred.
 */

/**
 * Creates a subscribable, asynchronous catalog state container.
 *
 * @param {CatalogStoreOptions} [options] Fetcher and initial page-size options.
 * @returns {{
 *   getState: () => Readonly<CatalogState>,
 *   subscribe: (listener: (state: Readonly<CatalogState>) => void) => () => void,
 *   setSearch: (query: unknown) => Promise<Readonly<CatalogState>> | undefined,
 *   setPage: (page: number) => Promise<Readonly<CatalogState>> | undefined,
 *   load: () => Promise<Readonly<CatalogState>>,
 *   retry: () => Promise<Readonly<CatalogState>>,
 *   destroy: () => void
 * }} Catalog store API.
 * @throws {RangeError} If initialLimit is not an integer from one to one hundred.
 */
export function createCatalogStore({
  fetcher = ({ page, limit, search, signal }) =>
    listProducts({ page, limit, ...(search !== undefined ? { search } : {}), signal }),
  initialLimit = DEFAULT_PAGE_SIZE,
} = {}) {
  if (!Number.isInteger(initialLimit) || initialLimit < 1 || initialLimit > 100) {
    throw new RangeError('initialLimit must be an integer between 1 and 100');
  }

  /** @type {CatalogState} */
  let state = {
    page: 1,
    limit: initialLimit,
    search: '',
    status: 'idle',
    products: [],
    meta: { page: 1, per_page: initialLimit, total: 0, total_pages: 0 },
    error: null,
  };
  /** @type {Set<(state: Readonly<CatalogState>) => void>} */
  const listeners = new Set();
  /** @type {AbortController | undefined} */
  let controller;
  let requestId = 0;
  let destroyed = false;

  const getState = () => Object.freeze({ ...state });
  const notify = () => {
    const snapshot = getState();
    for (const listener of [...listeners]) {
      listener(snapshot);
    }
  };

  const load = async () => {
    if (destroyed) {
      return getState();
    }

    controller?.abort();
    const currentController = new AbortController();
    controller = currentController;
    requestId += 1;
    const currentRequestId = requestId;

    state = { ...state, status: 'loading', error: null };
    notify();

    try {
      const envelope = await fetcher({
        page: state.page,
        limit: state.limit,
        search: state.search || undefined,
        signal: currentController.signal,
      });

      if (currentRequestId === requestId && !destroyed) {
        state = {
          ...state,
          status: 'success',
          products: envelope.data,
          meta: envelope.meta,
          error: null,
        };
        notify();
      }
    } catch (error) {
      if (currentRequestId === requestId && !destroyed) {
        const isAbort =
          (typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'ABORTED') ||
          (typeof error === 'object' &&
            error !== null &&
            'name' in error &&
            error.name === 'AbortError');

        if (!isAbort) {
          const errorCode =
            typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
          const errorMessage =
            typeof error === 'object' && error !== null && 'message' in error
              ? error.message
              : undefined;
          state = {
            ...state,
            status: 'error',
            products: [],
            error: {
              code: typeof errorCode === 'string' && errorCode ? errorCode : 'UNKNOWN_ERROR',
              message:
                typeof errorMessage === 'string' && errorMessage
                  ? errorMessage
                  : 'An unexpected error occurred.',
            },
          };
          notify();
        }
      }
    }

    return getState();
  };

  /** @param {unknown} query */
  const setSearch = (query) => {
    if (destroyed) {
      return Promise.resolve(getState());
    }
    const search = String(query).trim();
    if (search === state.search) {
      return undefined;
    }
    state = { ...state, search, page: 1 };
    return load();
  };

  /** @param {number} page */
  const setPage = (page) => {
    if (destroyed) {
      return Promise.resolve(getState());
    }
    if (!Number.isInteger(page) || page < 1 || page === state.page) {
      return undefined;
    }
    state = { ...state, page };
    return load();
  };

  /** @param {(state: Readonly<CatalogState>) => void} listener */
  const subscribe = (listener) => {
    if (destroyed) {
      return () => {};
    }
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const destroy = () => {
    if (destroyed) {
      return;
    }
    destroyed = true;
    requestId += 1;
    controller?.abort();
    controller = undefined;
    listeners.clear();
  };

  return {
    getState,
    subscribe,
    setSearch,
    setPage,
    load,
    retry: load,
    destroy,
  };
}
