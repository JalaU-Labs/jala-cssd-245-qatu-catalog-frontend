import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('application bootstrap', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [],
          meta: { page: 1, per_page: 12, total: 0, total_pages: 0 },
        }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('marks the root element ready when #app exists', async () => {
    const root = document.createElement('div');
    root.id = 'app';
    document.body.append(root);

    await import('./main.js');

    const mountedRoot = document.querySelector('#app');
    expect(mountedRoot).toBeInstanceOf(HTMLDivElement);
    if (!(mountedRoot instanceof HTMLDivElement)) {
      throw new Error('Root element #app not found');
    }
    expect(mountedRoot.dataset.ready).toBe('true');
  });

  it('throws when #app is missing', async () => {
    document.body.replaceChildren();

    vi.resetModules();

    await expect(import('./main.js')).rejects.toThrow('Root element #app not found');
  });
});
