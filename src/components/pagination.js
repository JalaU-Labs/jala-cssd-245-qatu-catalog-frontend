/**
 * Creates accessible page navigation for a paginated product result.
 *
 * @param {{ page?: number, totalPages?: number, total?: number }} [options] Current page and result counts.
 * @param {{ onPageChange?: (page: number) => void }} [callbacks] Page navigation callback.
 * @returns {HTMLElement} Pagination navigation landmark.
 * @throws {never} This factory does not throw.
 */
export function createPagination(
  { page = 1, totalPages = 0, total = 0 } = {},
  { onPageChange } = {},
) {
  const nav = document.createElement('nav');
  nav.className = 'pagination';
  nav.setAttribute('aria-label', 'Pagination');

  const previous = document.createElement('button');
  previous.className = 'pagination__prev';
  previous.type = 'button';
  previous.setAttribute('aria-label', 'Previous page');
  previous.textContent = 'Previous';
  previous.disabled = page <= 1;

  const summary = document.createElement('p');
  summary.className = 'pagination__summary';
  summary.setAttribute('aria-live', 'polite');
  if (totalPages >= 2) {
    summary.textContent = `Page ${page} of ${totalPages} — ${total} products`;
  } else if (totalPages === 1) {
    summary.textContent = `Page 1 of 1 — ${total} products`;
  } else {
    summary.textContent = total > 0 ? `${total} products` : 'No products';
  }

  const next = document.createElement('button');
  next.className = 'pagination__next';
  next.type = 'button';
  next.setAttribute('aria-label', 'Next page');
  next.textContent = 'Next';
  next.disabled = page >= totalPages || totalPages === 0;

  previous.addEventListener('click', () => {
    const targetPage = page - 1;
    if (!previous.disabled && targetPage >= 1 && targetPage <= totalPages) {
      onPageChange?.(targetPage);
    }
  });
  next.addEventListener('click', () => {
    const targetPage = page + 1;
    if (!next.disabled && targetPage >= 1 && targetPage <= totalPages) {
      onPageChange?.(targetPage);
    }
  });

  nav.append(previous, summary, next);
  return nav;
}
