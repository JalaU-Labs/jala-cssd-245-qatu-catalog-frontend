import { describe, expect, it, vi } from 'vitest';
import { productImageUrl } from '../utils/product-image.js';
import { createProductCard } from './product-card.js';

const product = {
  id: 'chair-1',
  name: 'Office chair',
  price: 199.99,
  currency: 'USD',
  average_rating: 4.8,
  ratings_count: 12,
  stock: 5,
};

/** @param {ParentNode} root @param {string} selector */
function getElement(root, selector) {
  const element = root.querySelector(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }
  return element;
}

/** @param {ParentNode} root */
function getImage(root) {
  const image = root.querySelector('img');
  if (!(image instanceof HTMLImageElement)) {
    throw new Error('Missing product image');
  }
  return image;
}

describe('createProductCard', () => {
  it('renders name, price, and rating', () => {
    const card = createProductCard(product);

    expect(getElement(card, '.product-card__name').textContent).toBe('Office chair');
    expect(getElement(card, '.product-card__price').textContent).toBe('$199.99');
    expect(getElement(card, '.product-card__rating').textContent).toBe('★ 4.8 (12)');
  });

  it("renders 'No ratings yet' when ratings_count is 0", () => {
    const card = createProductCard({ ...product, ratings_count: 0 });

    expect(getElement(card, '.product-card__rating').textContent).toBe('No ratings yet');
  });

  it("renders 'Out of stock' when stock is 0", () => {
    const card = createProductCard({ ...product, stock: 0 });

    expect(getElement(card, '.product-card__stock').textContent).toBe('Out of stock');
  });

  it('renders in-stock count when stock is positive', () => {
    const card = createProductCard({ ...product, stock: 5 });

    expect(getElement(card, '.product-card__stock').textContent).toBe('In stock: 5');
  });

  it('uses the deterministic image URL from productImageUrl', () => {
    const card = createProductCard(product);

    expect(getImage(card).src).toBe(productImageUrl(product));
  });

  it('sets lazy loading and product name as alternative text', () => {
    const card = createProductCard(product);
    const image = getImage(card);

    expect(image.loading).toBe('lazy');
    expect(image.alt).toBe('Office chair');
  });

  it('applies fallback image and calls onImageError when the image fails to load', () => {
    const onImageError = vi.fn();
    const card = createProductCard(product, { onImageError });
    const image = getImage(card);
    const errorEvent = new Event('error');

    image.dispatchEvent(errorEvent);

    expect(image.src).toBe(productImageUrl({}));
    expect(image.dataset.imageError).toBe('true');
    expect(onImageError).toHaveBeenCalledOnce();
    expect(onImageError).toHaveBeenCalledWith(product, errorEvent);
  });

  it('does not throw when product fields are missing', () => {
    expect(() => createProductCard({ id: 'x' })).not.toThrow();
  });
});
