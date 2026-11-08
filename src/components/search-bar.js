import { debounce } from '../utils/debounce.js';

/**
 * Creates an accessible, debounced product search form.
 *
 * @param {{ initialValue?: string, debounceMs?: number }} [options] Initial value and debounce delay.
 * @param {{ onSearch?: (value: string) => void }} [callbacks] Search callback.
 * @returns {HTMLFormElement & { setValue: (value: string) => void, focusInput: () => void }} Search form.
 * @throws {RangeError} If debounceMs is not a non-negative integer.
 */
export function createSearchBar({ initialValue = '', debounceMs = 500 } = {}, { onSearch } = {}) {
  const form = document.createElement('form');
  form.className = 'search-bar';
  form.setAttribute('role', 'search');
  form.noValidate = true;

  const label = document.createElement('label');
  label.className = 'visually-hidden';
  label.htmlFor = 'search-bar-input';
  label.textContent = 'Search products';

  const input = document.createElement('input');
  input.id = 'search-bar-input';
  input.className = 'search-bar__input';
  input.type = 'search';
  input.name = 'q';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.placeholder = 'Search products by name...';
  input.maxLength = 200;
  input.value = initialValue;

  const clearButton = document.createElement('button');
  clearButton.className = 'search-bar__clear';
  clearButton.type = 'button';
  clearButton.setAttribute('aria-label', 'Clear search');
  clearButton.textContent = '\u00D7';
  clearButton.hidden = !input.value.trim();

  let lastEmittedValue = initialValue.trim();
  const emitSearch = debounce(() => {
    const value = input.value.trim();
    if (value !== lastEmittedValue) {
      lastEmittedValue = value;
      onSearch?.(value);
    }
  }, debounceMs);

  input.addEventListener('input', () => {
    clearButton.hidden = !input.value.trim();
    emitSearch();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    emitSearch.flush();
  });

  clearButton.addEventListener('click', () => {
    const previousValue = lastEmittedValue;
    input.value = '';
    clearButton.hidden = true;
    emitSearch.cancel();
    input.focus();
    if (previousValue !== '') {
      lastEmittedValue = '';
      onSearch?.('');
    }
  });

  form.append(label, input, clearButton);
  Object.defineProperties(form, {
    setValue: {
      /**
       * Sets the current search text without emitting a search.
       *
       * @param {string} value New input value.
       * @returns {void}
       */
      value(value) {
        input.value = value;
        clearButton.hidden = !value.trim();
      },
    },
    focusInput: {
      /**
       * Moves keyboard focus to the search input.
       *
       * @returns {void}
       */
      value() {
        input.focus();
      },
    },
  });

  return /** @type {HTMLFormElement & { setValue: (value: string) => void, focusInput: () => void }} */ (
    form
  );
}
