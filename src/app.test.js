import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './api/http.js';
import { mountCatalogApp } from './app.js';
import { createCatalogStore } from './state/catalog-store.js';

/** @type {import('./types/product.js').Product[]} */
const products = [
  {
    id: 'product-1',
    seller_id: 'seller-1',
    category_id: null,
    name: 'Desk',
    slug: 'desk',
    description: null,
    price: 99,
    currency: 'USD',
    stock: 3,
    attributes: {},
    primary_image_path: null,
    state: 'published',
    average_rating: 0,
    ratings_count: 0,
    published_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'product-2',
    seller_id: 'seller-1',
    category_id: null,
    name: 'Chair',
    slug: 'chair',
    description: null,
    price: 49,
    currency: 'USD',
    stock: 0,
    attributes: {},
    primary_image_path: null,
    state: 'published',
    average_rating: 0,
    ratings_count: 0,
    published_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

/** @type {import('./types/product.js').ProductListEnvelope} */
const envelope = {
  data: products,
  meta: { page: 1, per_page: 12, total: 14, total_pages: 2 },
};

/** @type {import('vitest').Mock} */
let fetcher;
/** @type {HTMLElement} */
let root;

function createStore() {
  return createCatalogStore({ fetcher });
}

/** @param {ParentNode} container @param {string} selector */
function getButton(container, selector) {
  const button = container.querySelector(selector);
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Missing button: ${selector}`);
  }
  return button;
}

/** @param {ParentNode} container */
function getSearchInput(container) {
  const input = container.querySelector('#search-bar-input');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Missing search input');
  }
  return input;
}

/** @param {ParentNode} container */
function getResults(container) {
  const results = container.querySelector('.app-results');
  if (!(results instanceof HTMLElement)) {
    throw new Error('Missing catalog results');
  }
  return results;
}

describe('mountCatalogApp', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    root = document.createElement('div');
    fetcher = vi.fn().mockResolvedValue(envelope);
  });

  it('throws TypeError when root or store is invalid', () => {
    expect(() =>
      mountCatalogApp({
        root: /** @type {HTMLElement} */ (Object.create(null)),
        store: createStore(),
      }),
    ).toThrow(new TypeError('root must be an HTMLElement'));
    expect(() =>
      mountCatalogApp({
        root,
        store: /** @type {ReturnType<typeof createCatalogStore>} */ ({}),
      }),
    ).toThrow(new TypeError('store must expose getState and subscribe'));
  });

  it('mounts the shell with header, search, results, and footer', () => {
    mountCatalogApp({ root, store: createStore() });

    expect(root.querySelector('.app-header')).not.toBeNull();
    expect(root.querySelector('.app-search')).not.toBeNull();
    expect(root.querySelector('.app-results')).not.toBeNull();
    expect(root.querySelector('.app-footer')).not.toBeNull();
  });

  it('renders skeleton on initial idle state', () => {
    const store = createStore();

    mountCatalogApp({ root, store });

    expect(root.querySelectorAll('.skeleton-card')).toHaveLength(store.getState().limit);
  });

  it('renders product cards after successful load', async () => {
    const store = createStore();
    mountCatalogApp({ root, store });

    await store.load();
    await vi.waitFor(() => expect(root.querySelectorAll('.product-card').length).toBe(2));
  });

  it('renders the empty state without action when search is empty', async () => {
    fetcher.mockResolvedValue({
      data: [],
      meta: { page: 1, per_page: 12, total: 0, total_pages: 0 },
    });
    const store = createStore();
    mountCatalogApp({ root, store });

    await store.load();

    expect(root.querySelector('.state-message--empty')).not.toBeNull();
    expect(root.querySelector('.state-message__action')).toBeNull();
  });

  it('renders the empty state with Clear search when search is active', async () => {
    fetcher.mockResolvedValue({
      data: [],
      meta: { page: 1, per_page: 12, total: 0, total_pages: 0 },
    });
    const store = createStore();
    mountCatalogApp({ root, store });

    await store.setSearch('xyz');

    expect(getButton(root, '.state-message__action').textContent).toBe('Clear search');
  });

  it("clearing search resets the search bar and triggers store.setSearch('')", async () => {
    fetcher.mockResolvedValue({
      data: [],
      meta: { page: 1, per_page: 12, total: 0, total_pages: 0 },
    });
    const store = createStore();
    const setSearch = vi.spyOn(store, 'setSearch');
    mountCatalogApp({ root, store });
    await store.setSearch('xyz');

    getButton(root, '.state-message__action').click();

    expect(setSearch).toHaveBeenLastCalledWith('');
    expect(getSearchInput(root).value).toBe('');
  });

  it('renders the error state with Retry when fetch fails', async () => {
    fetcher.mockRejectedValue(new ApiError('Boom', { code: 'HTTP_ERROR', status: 500 }));
    const store = createStore();
    mountCatalogApp({ root, store });

    await store.load();

    expect(root.querySelector('.state-message--error')).not.toBeNull();
    expect(getButton(root, '.state-message__action').textContent).toBe('Retry');
  });

  it('clicking Retry triggers another fetch', async () => {
    fetcher.mockRejectedValueOnce(new ApiError('Boom', { code: 'HTTP_ERROR', status: 500 }));
    const store = createStore();
    mountCatalogApp({ root, store });
    await store.load();

    getButton(root, '.state-message__action').click();
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });

  it('renders pagination after successful load', async () => {
    const store = createStore();
    mountCatalogApp({ root, store });

    await store.load();

    expect(root.querySelector('.pagination')).not.toBeNull();
  });

  it('clicking Next on pagination triggers store.setPage with page plus one', async () => {
    const store = createStore();
    const setPage = vi.spyOn(store, 'setPage');
    mountCatalogApp({ root, store });
    await store.load();

    getButton(root, '.pagination__next').click();

    expect(setPage).toHaveBeenCalledWith(2);
  });

  it('sets aria-busy during loading and clears it after the request', async () => {
    /** @type {(value: typeof envelope) => void} */
    let resolveRequest = () => {};
    fetcher.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const store = createStore();
    mountCatalogApp({ root, store });

    const pendingLoad = store.load();
    expect(getResults(root).getAttribute('aria-busy')).toBe('true');

    resolveRequest(envelope);
    await pendingLoad;

    expect(getResults(root).getAttribute('aria-busy')).toBe('false');
  });

  it('unmount clears the root and stops updates', async () => {
    const store = createStore();
    const { unmount } = mountCatalogApp({ root, store });

    unmount();
    await store.setSearch('changed');

    expect(root.childElementCount).toBe(0);
  });
});
