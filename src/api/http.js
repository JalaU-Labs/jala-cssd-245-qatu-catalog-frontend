/** @typedef {import('../types/product.js').ApiErrorBody} ApiErrorBody */

export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {{ code?: string, status?: number, details?: Array<{ field?: string, message: string }> }} [options]
   * @throws {never} This constructor does not throw.
   */
  constructor(message, { code = 'API_ERROR', status, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Resolves the configured API base URL or the local development default.
 *
 * @returns {string} Base URL without a trailing slash.
 * @throws {never} This function does not throw.
 */
export function resolveApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL;
  const baseUrl = typeof configuredUrl === 'string' ? configuredUrl.trim() : '';

  return (baseUrl || 'http://localhost:3000').replace(/\/$/, '');
}

/**
 * Fetches JSON from the API.
 *
 * @param {string} path Pathname and query string.
 * @param {{ signal?: AbortSignal, baseUrl?: string }} [options] Request options.
 * @returns {Promise<unknown>} Parsed JSON response body.
 * @throws {ApiError} When the network request or response is unsuccessful.
 */
export async function getJson(path, { signal, baseUrl } = {}) {
  const url = `${baseUrl ?? resolveApiBaseUrl()}${path}`;
  let response;

  try {
    response = await fetch(url, {
      method: 'GET',
      ...(signal !== undefined ? { signal } : {}),
      headers: { Accept: 'application/json' },
      credentials: 'omit',
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
      throw new ApiError('Request aborted', { code: 'ABORTED' });
    }

    const originalMessage = error instanceof Error ? error.message : String(error);
    throw new ApiError(`Network error: ${originalMessage}`, { code: 'NETWORK_ERROR' });
  }

  if (response.ok) {
    try {
      return await response.json();
    } catch {
      throw new ApiError('Invalid JSON response', {
        code: 'INVALID_JSON',
        status: response.status,
      });
    }
  }

  try {
    /** @type {ApiErrorBody} */
    const body = await response.json();
    if (
      body &&
      typeof body === 'object' &&
      body.error &&
      typeof body.error.code === 'string' &&
      typeof body.error.message === 'string'
    ) {
      throw new ApiError(body.error.message, {
        code: body.error.code,
        status: response.status,
        ...(body.error.details !== undefined ? { details: body.error.details } : {}),
      });
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
  }

  throw new ApiError(`Request failed with status ${response.status}`, {
    code: 'HTTP_ERROR',
    status: response.status,
  });
}
