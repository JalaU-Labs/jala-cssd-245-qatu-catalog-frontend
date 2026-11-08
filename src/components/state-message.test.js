import { describe, expect, it, vi } from 'vitest';
import { createStateMessage } from './state-message.js';

/** @param {ParentNode} root @param {string} selector */
function getElement(root, selector) {
  const element = root.querySelector(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }
  return element;
}

describe('createStateMessage', () => {
  it('renders error title and description with alert role and assertive live region', () => {
    const message = createStateMessage({
      variant: 'error',
      title: 'Unable to load products',
      description: 'Try again.',
    });

    expect(message.getAttribute('role')).toBe('alert');
    expect(message.getAttribute('aria-live')).toBe('assertive');
    expect(getElement(message, '.state-message__title').textContent).toBe(
      'Unable to load products',
    );
    expect(getElement(message, '.state-message__description').textContent).toBe('Try again.');
  });

  it('renders empty title and description with status role and polite live region', () => {
    const message = createStateMessage({
      variant: 'empty',
      title: 'No matching products',
      description: 'Change your search.',
    });

    expect(message.getAttribute('role')).toBe('status');
    expect(message.getAttribute('aria-live')).toBe('polite');
    expect(getElement(message, '.state-message__title').textContent).toBe('No matching products');
    expect(getElement(message, '.state-message__description').textContent).toBe(
      'Change your search.',
    );
  });

  it('throws RangeError for an unknown variant', () => {
    expect(() => createStateMessage({ variant: 'warning' })).toThrow(
      new RangeError('Invalid variant: warning'),
    );
  });

  it('renders the action button only when actionLabel and onAction are provided', () => {
    expect(
      createStateMessage({ variant: 'error', actionLabel: 'Retry' }).querySelector('button'),
    ).toBeNull();
    expect(
      createStateMessage({ variant: 'error' }, { onAction: vi.fn() }).querySelector('button'),
    ).toBeNull();
    expect(
      getElement(
        createStateMessage({ variant: 'error', actionLabel: 'Retry' }, { onAction: vi.fn() }),
        'button',
      ).textContent,
    ).toBe('Retry');
  });

  it('calls onAction when the action button is clicked', () => {
    const onAction = vi.fn();
    const message = createStateMessage(
      { variant: 'empty', actionLabel: 'Clear search' },
      { onAction },
    );

    getElement(message, 'button').dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onAction).toHaveBeenCalledOnce();
  });

  it('does not render a description when omitted', () => {
    const message = createStateMessage({ title: 'Information' });

    expect(message.querySelector('.state-message__description')).toBeNull();
  });

  it('uses title text as text instead of interpreting HTML', () => {
    const message = createStateMessage({ title: '<b>x</b>' });

    expect(getElement(message, '.state-message__title').textContent).toBe('<b>x</b>');
    expect(message.querySelector('b')).toBeNull();
  });
});
