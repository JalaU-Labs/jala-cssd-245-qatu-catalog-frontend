import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce } from './debounce.js';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('invokes after the delay with the latest arguments', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced('first');
    debounced('latest');
    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledExactlyOnceWith('latest');
  });

  it('coalesces rapid calls into one invocation', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced(1);
    vi.advanceTimersByTime(50);
    debounced(2);
    vi.advanceTimersByTime(99);

    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledExactlyOnceWith(2);
  });

  it('cancel prevents a pending invocation', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced('pending');
    debounced.cancel();
    vi.advanceTimersByTime(100);

    expect(callback).not.toHaveBeenCalled();
  });

  it('flush invokes immediately and clears the timer', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced('pending');
    debounced.flush();
    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledExactlyOnceWith('pending');
  });

  it('returns undefined from flush when nothing is pending', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    expect(debounced.flush()).toBeUndefined();
    expect(callback).not.toHaveBeenCalled();
  });

  it('preserves this binding', () => {
    const context = { prefix: 'item' };
    const callback = vi.fn(
      /** @this {{ prefix: string }} */
      function (value) {
        return `${this.prefix}-${value}`;
      },
    );
    const debounced = debounce(callback, 100);

    debounced.call(context, 'one');
    debounced.flush();

    expect(callback).toHaveBeenCalledOnce();
    expect(callback.mock.results[0]?.value).toBe('item-one');
  });

  it('throws RangeError for a negative delay', () => {
    expect(() => debounce(vi.fn(), -1)).toThrow(RangeError);
  });
});
