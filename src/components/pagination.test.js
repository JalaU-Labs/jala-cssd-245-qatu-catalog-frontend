import { describe, expect, it, vi } from 'vitest';
import { createPagination } from './pagination.js';

/** @param {ParentNode} root @param {string} selector */
function getElement(root, selector) {
  const element = root.querySelector(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }
  return element;
}

/** @param {ParentNode} root @param {string} selector */
function getButton(root, selector) {
  const button = root.querySelector(selector);
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Missing button: ${selector}`);
  }
  return button;
}

describe('createPagination', () => {
  it('renders the summary for a multi-page result', () => {
    const pagination = createPagination({ page: 2, totalPages: 5, total: 97 });

    expect(getElement(pagination, '.pagination__summary').textContent).toBe(
      'Page 2 of 5 — 97 products',
    );
  });

  it('renders the summary for a single-page result', () => {
    const pagination = createPagination({ page: 1, totalPages: 1, total: 3 });

    expect(getElement(pagination, '.pagination__summary').textContent).toBe(
      'Page 1 of 1 — 3 products',
    );
  });

  it("renders 'No products' when total is 0", () => {
    expect(getElement(createPagination(), '.pagination__summary').textContent).toBe('No products');
  });

  it('disables Previous on the first page', () => {
    expect(
      getButton(createPagination({ page: 1, totalPages: 3 }), '.pagination__prev').disabled,
    ).toBe(true);
  });

  it('disables Next on the last page', () => {
    expect(
      getButton(createPagination({ page: 3, totalPages: 3 }), '.pagination__next').disabled,
    ).toBe(true);
  });

  it('disables both buttons when there are no pages', () => {
    const pagination = createPagination();

    expect(getButton(pagination, '.pagination__prev').disabled).toBe(true);
    expect(getButton(pagination, '.pagination__next').disabled).toBe(true);
  });

  it('calls onPageChange with the previous page when Previous is clicked', () => {
    const onPageChange = vi.fn();
    const pagination = createPagination({ page: 2, totalPages: 3 }, { onPageChange });

    getButton(pagination, '.pagination__prev').click();

    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('calls onPageChange with the next page when Next is clicked', () => {
    const onPageChange = vi.fn();
    const pagination = createPagination({ page: 2, totalPages: 3 }, { onPageChange });

    getButton(pagination, '.pagination__next').click();

    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(3);
  });

  it('does not call onPageChange when a disabled button is clicked', () => {
    const onPageChange = vi.fn();
    const pagination = createPagination({ page: 1, totalPages: 2 }, { onPageChange });

    getButton(pagination, '.pagination__prev').click();

    expect(onPageChange).not.toHaveBeenCalled();
  });
});
