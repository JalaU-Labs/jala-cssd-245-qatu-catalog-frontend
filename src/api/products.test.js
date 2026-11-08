import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listProducts } from './products.js';

/** @type {import('vitest').Mock} */
let fetchMock;

const envelope = {
  data: [],
  meta: { page: 1, per_page: 12, total: 0, total_pages: 0 },
};

describe('listProducts', () => {
  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(envelope), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds URL with page and limit, omits search', async () => {
    await listProducts({ page: 2, limit: 12 });

    expect(fetchMock.mock.calls[0]?.[0]).toContain('/v1/products?page=2&limit=12');
  });

  it('includes search when non-empty', async () => {
    await listProducts({ page: 1, limit: 12, search: 'chair' });

    expect(fetchMock.mock.calls[0]?.[0]).toContain('search=chair');
  });

  it('omits search when empty or whitespace', async () => {
    await listProducts({ search: '   ' });

    expect(fetchMock.mock.calls[0]?.[0]).not.toContain('search=');
  });

  it('trims search before sending', async () => {
    await listProducts({ search: '  chair  ' });

    expect(fetchMock.mock.calls[0]?.[0]).toContain('search=chair');
    expect(fetchMock.mock.calls[0]?.[0]).not.toContain('search=++chair++');
  });

  it('throws RangeError for page below one without fetching', async () => {
    await expect(listProducts({ page: 0 })).rejects.toBeInstanceOf(RangeError);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws RangeError for limit out of range without fetching', async () => {
    await expect(listProducts({ limit: 0 })).rejects.toBeInstanceOf(RangeError);
    await expect(listProducts({ limit: 101 })).rejects.toBeInstanceOf(RangeError);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws RangeError for search longer than 200 without fetching', async () => {
    await expect(listProducts({ search: 'x'.repeat(201) })).rejects.toBeInstanceOf(RangeError);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns the raw envelope', async () => {
    const fakeProduct = { id: 'product-1', name: 'Chair' };
    const body = {
      data: [fakeProduct],
      meta: { page: 1, per_page: 12, total: 1, total_pages: 1 },
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));

    await expect(listProducts()).resolves.toEqual(body);
  });

  it('passes signal through to fetch', async () => {
    const controller = new AbortController();

    await listProducts({ signal: controller.signal });

    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(controller.signal);
  });
});
