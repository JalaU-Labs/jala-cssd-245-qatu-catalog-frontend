import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSearchBar } from './search-bar.js';

/** @param {ParentNode} root */
function getInput(root) {
  const input = root.querySelector('input');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Missing search input');
  }
  return input;
}

/** @param {ParentNode} root */
function getButton(root) {
  const button = root.querySelector('button');
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error('Missing search clear button');
  }
  return button;
}

/** @param {ParentNode} root */
function getLabel(root) {
  const label = root.querySelector('label');
  if (!(label instanceof HTMLLabelElement)) {
    throw new Error('Missing search label');
  }
  return label;
}

describe('createSearchBar', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders an accessible search input with a visually hidden label', () => {
    const form = createSearchBar();

    expect(form.getAttribute('role')).toBe('search');
    expect(getLabel(form).htmlFor).toBe('search-bar-input');
    expect(getLabel(form).className).toBe('visually-hidden');
    expect(getInput(form).type).toBe('search');
  });

  it('emits onSearch after the debounce delay with the trimmed value', () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const form = createSearchBar({ debounceMs: 200 }, { onSearch });
    const input = getInput(form);
    input.value = '  chair  ';
    input.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(200);

    expect(onSearch).toHaveBeenCalledExactlyOnceWith('chair');
  });

  it('coalesces rapid keystrokes into one emission', () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const form = createSearchBar({ debounceMs: 200 }, { onSearch });
    const input = getInput(form);
    input.value = 'c';
    input.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(50);
    input.value = 'chair';
    input.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(200);

    expect(onSearch).toHaveBeenCalledExactlyOnceWith('chair');
  });

  it('does not emit when the trimmed value is unchanged', () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const form = createSearchBar({ initialValue: 'chair', debounceMs: 100 }, { onSearch });
    const input = getInput(form);
    input.value = ' chair ';
    input.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(100);

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('flushes the pending debounce immediately on form submit', () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const form = createSearchBar({ debounceMs: 500 }, { onSearch });
    const input = getInput(form);
    input.value = 'desk';
    input.dispatchEvent(new Event('input'));

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(onSearch).toHaveBeenCalledExactlyOnceWith('desk');
  });

  it('hides the clear button when the input is empty', () => {
    const form = createSearchBar();

    expect(getButton(form).hidden).toBe(true);
  });

  it('resets the input and emits an empty string immediately when cleared', () => {
    const onSearch = vi.fn();
    const form = createSearchBar({ initialValue: 'chair' }, { onSearch });
    const input = getInput(form);
    const clearButton = getButton(form);

    clearButton.click();

    expect(input.value).toBe('');
    expect(clearButton.hidden).toBe(true);
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('');
  });

  it('cancels a pending debounced emission when cleared', () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const form = createSearchBar({ debounceMs: 200 }, { onSearch });
    const input = getInput(form);
    input.value = 'chair';
    input.dispatchEvent(new Event('input'));
    getButton(form).click();
    vi.advanceTimersByTime(200);

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('sets the input and clear button visibility without emitting', () => {
    const onSearch = vi.fn();
    const form = createSearchBar({}, { onSearch });

    form.setValue('table');

    expect(getInput(form).value).toBe('table');
    expect(getButton(form).hidden).toBe(false);
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('focuses the input when focusInput is called', () => {
    const form = createSearchBar();
    document.body.append(form);

    form.focusInput();

    expect(document.activeElement).toBe(getInput(form));
  });
});
