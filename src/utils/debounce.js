/**
 * Delays invoking a function until calls stop for the configured interval.
 *
 * @template {(...args: never[]) => unknown} T
 * @param {T} fn Function to invoke after the delay.
 * @param {number} delay Non-negative integer delay in milliseconds.
 * @returns {T & { cancel: () => void, flush: () => ReturnType<T> | undefined }} Debounced function.
 * @throws {RangeError} If delay is not a non-negative finite integer.
 */
export function debounce(fn, delay) {
  if (!Number.isFinite(delay) || !Number.isInteger(delay) || delay < 0) {
    throw new RangeError('delay must be a non-negative finite integer');
  }

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  /** @type {Parameters<T> | undefined} */
  let latestArgs;
  /** @type {ThisParameterType<T> | undefined} */
  let latestThis;

  /** @returns {ReturnType<T> | undefined} */
  const invoke = () => {
    if (latestArgs === undefined) {
      return undefined;
    }

    const args = latestArgs;
    const context = latestThis;
    latestArgs = undefined;
    latestThis = undefined;
    return /** @type {ReturnType<T>} */ (fn.apply(context, args));
  };

  /**
   * @this {ThisParameterType<T>}
   * @param {...Parameters<T>[number]} args
   */
  const debounced = function (...args) {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    latestArgs = /** @type {Parameters<T>} */ (args);
    latestThis = this;
    timer = setTimeout(() => {
      timer = undefined;
      invoke();
    }, delay);
  };

  const cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    latestArgs = undefined;
    latestThis = undefined;
  };

  const flush = () => {
    if (timer === undefined) {
      return undefined;
    }
    clearTimeout(timer);
    timer = undefined;
    return invoke();
  };

  return /** @type {T & { cancel: () => void, flush: () => ReturnType<T> | undefined }} */ (
    /** @type {unknown} */ (Object.assign(debounced, { cancel, flush }))
  );
}
