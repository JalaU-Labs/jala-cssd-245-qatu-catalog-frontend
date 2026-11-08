/**
 * Creates one accessible-hidden product card placeholder.
 *
 * @returns {HTMLElement} Skeleton card container.
 * @throws {never} This factory does not throw.
 */
export function createSkeletonCard() {
  const card = document.createElement('div');
  card.className = 'skeleton-card';
  card.setAttribute('aria-hidden', 'true');

  const image = document.createElement('div');
  image.className = 'skeleton-card__image';

  const line = document.createElement('div');
  line.className = 'skeleton-card__line';

  const shortLine = document.createElement('div');
  shortLine.className = 'skeleton-card__line skeleton-card__line--short';

  card.append(image, line, shortLine);
  return card;
}

/**
 * Creates a responsive grid of product-card placeholders.
 *
 * @param {number} [count=12] Requested number of placeholder cards.
 * @returns {HTMLElement} Skeleton grid container.
 * @throws {never} This factory does not throw for numeric counts.
 */
export function createSkeletonGrid(count = 12) {
  const grid = document.createElement('div');
  grid.className = 'skeleton-grid';
  grid.setAttribute('aria-hidden', 'true');
  grid.setAttribute('role', 'presentation');

  const clampedCount = Math.max(0, Math.min(48, Math.trunc(count)));
  for (let index = 0; index < clampedCount; index += 1) {
    grid.append(createSkeletonCard());
  }
  return grid;
}
