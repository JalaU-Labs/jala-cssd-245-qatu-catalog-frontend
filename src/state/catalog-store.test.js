import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCatalogStore, DEFAULT_PAGE_SIZE } from './catalog-store.js';

const envelope = {
  data: [
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
  ],
  meta: { page: 1, per_page: 12, total: 1, total_pages: 1 },
};

/** @type {import('vitest').Mock} */
let fetcher;

function createStore(options = {}) {
  return createCatalogStore({ fetcher, ...options });
}

describe('catalog store', () => {
  beforeEach(() => {
    fetcher = vi.fn().mockResolvedValue(envelope);
  });

  it('initial state has page 1, default limit, empty search, and idle status', () => {
    const state = createStore().getState();

    expect(state).toEqual({
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      search: '',
      status: 'idle',
      products: [],
      meta: { page: 1, per_page: DEFAULT_PAGE_SIZE, total: 0, total_pages: 0 },
      error: null,
    });
    expect(Object.isFrozen(state)).toBe(true);
  });

  it('throws RangeError when initialLimit is out of range', () => {
    expect(() => createStore({ initialLimit: 0 })).toThrow(RangeError);
    expect(() => createStore({ initialLimit: 101 })).toThrow(RangeError);
  });

  it('load transitions loading then success and stores products plus meta', async () => {
    const store = createStore();
    /** @type {Array<ReturnType<ReturnType<typeof createCatalogStore>['getState']>>} */
    const states = [];
    store.subscribe((state) => states.push(state));

    const result = await store.load();

    expect(states.map((state) => state.status)).toEqual(['loading', 'success']);
    expect(result.products).toEqual(envelope.data);
    expect(result.meta).toEqual(envelope.meta);
  });

  it('load stores error state and message on failure', async () => {
    fetcher.mockRejectedValue(new Error('Unavailable'));
    const store = createStore();

    const result = await store.load();

    expect(result.status).toBe('error');
    expect(result.products).toEqual([]);
    expect(result.error).toEqual({
      code: 'UNKNOWN_ERROR',
      message: 'Unavailable',
    });
  });

  it('load ignores ABORTED errors and keeps the current loading state', async () => {
    /** @type {Error & { code?: string }} */
    const error = new Error('Request aborted');
    error.code = 'ABORTED';
    fetcher.mockRejectedValue(error);
    const store = createStore();

    const result = await store.load();

    expect(result.status).toBe('loading');
    expect(result.error).toBeNull();
  });

  it('load aborts any in-flight request when called again', async () => {
    /** @type {Array<{ signal: AbortSignal, resolve: (value: typeof envelope) => void }>} */
    const pending = [];
    fetcher.mockImplementation(
      ({ signal }) =>
        new Promise((resolve) => {
          pending.push({ signal, resolve });
        }),
    );
    const store = createStore();

    const firstLoad = store.load();
    const firstSignal = pending[0]?.signal;
    const secondLoad = store.load();
    pending[0]?.resolve(envelope);
    pending[1]?.resolve(envelope);

    await Promise.all([firstLoad, secondLoad]);

    expect(firstSignal?.aborted).toBe(true);
  });

  it('setSearch updates search, resets page to 1, and triggers load', async () => {
    const store = createStore();
    await store.setPage(2);

    await store.setSearch(' desk ');

    expect(store.getState().search).toBe('desk');
    expect(store.getState().page).toBe(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('setSearch with the same trimmed value does not trigger load', async () => {
    const store = createStore();
    await store.setSearch('desk');
    fetcher.mockClear();

    expect(store.setSearch(' desk ')).toBeUndefined();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('setSearch with whitespace-only input resets to empty string', async () => {
    const store = createStore();
    await store.setSearch('desk');

    await store.setSearch('   ');

    expect(store.getState().search).toBe('');
    expect(fetcher).toHaveBeenLastCalledWith(expect.objectContaining({ search: undefined }));
  });

  it('setPage updates page and triggers load', async () => {
    const store = createStore();

    await store.setPage(3);

    expect(store.getState().page).toBe(3);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('setPage with the same value does not trigger load', () => {
    const store = createStore();

    expect(store.setPage(1)).toBeUndefined();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('setPage with invalid values is a no-op', () => {
    const store = createStore();

    for (const page of [0, -1, 1.5, Number.NaN]) {
      expect(store.setPage(page)).toBeUndefined();
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('retry triggers a new fetch with current page and search', async () => {
    const store = createStore();
    await store.setSearch('lamp');
    await store.setPage(2);
    fetcher.mockClear();

    await store.retry();

    expect(fetcher).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ page: 2, search: 'lamp' }),
    );
  });

  it('subscribe is notified on every state change', async () => {
    const store = createStore();
    const listener = vi.fn();
    store.subscribe(listener);

    await store.load();

    expect(listener.mock.calls.map(([state]) => state.status)).toEqual(['loading', 'success']);
  });

  it('unsubscribe stops notifications', async () => {
    const store = createStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();

    await store.load();

    expect(listener).not.toHaveBeenCalled();
  });

  it('destroy aborts in-flight requests and subsequent calls are no-ops', async () => {
    /** @type {AbortSignal | undefined} */
    let requestSignal;
    /** @type {(value: typeof envelope) => void} */
    let resolveRequest = () => {};
    fetcher.mockImplementation(({ signal }) => {
      requestSignal = signal;
      return new Promise((resolve) => {
        resolveRequest = resolve;
      });
    });
    const store = createStore();
    const pendingLoad = store.load();

    store.destroy();
    resolveRequest(envelope);
    await pendingLoad;

    expect(requestSignal?.aborted).toBe(true);
    expect(store.setSearch('changed')).toBeInstanceOf(Promise);
    expect(store.setPage(2)).toBeInstanceOf(Promise);
    expect(store.load()).toBeInstanceOf(Promise);
    await store.retry();
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('fetcher receives trimmed search or undefined when empty', async () => {
    const store = createStore();
    await store.setSearch(' desk ');
    await store.setSearch(' ');

    expect(fetcher).toHaveBeenLastCalledWith(expect.objectContaining({ search: undefined }));
  });
});
