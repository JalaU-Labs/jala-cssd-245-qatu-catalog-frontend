import { describe, expect, it } from 'vitest';
import { createSkeletonCard, createSkeletonGrid } from './skeleton.js';

describe('skeleton components', () => {
  it('returns an aria-hidden card with three child blocks', () => {
    const card = createSkeletonCard();

    expect(card.className).toBe('skeleton-card');
    expect(card.getAttribute('aria-hidden')).toBe('true');
    expect(card.children).toHaveLength(3);
    expect(card.textContent).toBe('');
  });

  it('returns the requested number of skeleton cards', () => {
    expect(createSkeletonGrid(4).children).toHaveLength(4);
  });

  it('clamps the grid to 48 cards for larger counts', () => {
    expect(createSkeletonGrid(100).children).toHaveLength(48);
  });

  it('returns an empty grid for count zero', () => {
    expect(createSkeletonGrid(0).children).toHaveLength(0);
  });

  it('clamps negative counts to zero', () => {
    expect(createSkeletonGrid(-2).children).toHaveLength(0);
  });
});
