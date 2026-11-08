import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, getJson, resolveApiBaseUrl } from './http.js';

/** @type {import('vitest').Mock} */
let fetchMock;

describe('HTTP API helpers', () => {
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('returns parsed JSON on 200', async () => {
    const body = { data: [] };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(getJson('/v1/products')).resolves.toEqual(body);
  });

  it('throws ApiError with backend error code on 400', async () => {
    const details = [{ field: 'page', message: 'must be >= 1' }];
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: 'VALIDATION_ERROR', message: 'Invalid', details },
          meta: { timestamp: '2026-11-07T00:00:00.000Z' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const error = /** @type {ApiError} */ (await getJson('/v1/products').catch((reason) => reason));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.status).toBe(400);
    expect(error.details).toEqual(details);
  });

  it('falls back to HTTP_ERROR code when error body is not JSON', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>Server error</html>', {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }),
    );

    const error = /** @type {ApiError} */ (await getJson('/v1/products').catch((reason) => reason));

    expect(error.code).toBe('HTTP_ERROR');
    expect(error.status).toBe(500);
  });

  it('wraps network failures as NETWORK_ERROR', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = /** @type {ApiError} */ (await getJson('/v1/products').catch((reason) => reason));

    expect(error.code).toBe('NETWORK_ERROR');
  });

  it('maps AbortError to ABORTED', async () => {
    fetchMock.mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'));

    const error = /** @type {ApiError} */ (await getJson('/v1/products').catch((reason) => reason));

    expect(error.code).toBe('ABORTED');
  });

  it('passes the AbortSignal to fetch', async () => {
    const controller = new AbortController();
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));

    await getJson('/v1/products', { signal: controller.signal });

    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(controller.signal);
  });

  it('uses the default API base URL when the environment variable is unset', () => {
    vi.stubEnv('VITE_API_BASE_URL', '');

    expect(resolveApiBaseUrl()).toBe('http://localhost:3000');
  });
});
