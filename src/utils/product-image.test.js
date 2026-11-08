import { describe, expect, it } from 'vitest';
import { productImageAlt, productImageUrl } from './product-image.js';

describe('product image helpers', () => {
  it('returns a deterministic URL for the same product id', () => {
    expect(productImageUrl({ id: 'product-1' })).toBe(productImageUrl({ id: 'product-1' }));
  });

  it('returns different URLs for different ids', () => {
    expect(productImageUrl({ id: 'a' })).not.toBe(productImageUrl({ id: 'b' }));
  });

  it('returns the fallback URL when id is missing', () => {
    expect(productImageUrl({})).toBe('https://picsum.photos/seed/fallback-400x300/400/300');
  });

  it('includes width and height in the URL', () => {
    expect(productImageUrl({ id: 'a' }, { width: 200, height: 100 })).toMatch(/200x100\/200\/100$/);
  });

  it('returns the product name as image alternative text', () => {
    expect(productImageAlt({ name: ' Chair ' })).toBe('Chair');
  });

  it("falls back to 'Product image' when the name is empty", () => {
    expect(productImageAlt({ name: '  ' })).toBe('Product image');
  });
});
