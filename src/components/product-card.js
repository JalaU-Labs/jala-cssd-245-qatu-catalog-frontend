import { formatCurrency } from '../utils/format.js';
import { productImageAlt, productImageUrl } from '../utils/product-image.js';

/**
 * Creates a product card for catalog display.
 *
 * @param {import('../types/product.js').Product | Record<string, unknown> | null} product Product data.
 * @param {{ onImageError?: (product: unknown, event: Event) => void }} [callbacks] Optional image callback.
 * @returns {HTMLElement} Product card article.
 */
export function createProductCard(product, { onImageError } = {}) {
  const item = product && typeof product === 'object' ? product : {};
  const article = document.createElement('article');
  article.className = 'product-card';

  const image = document.createElement('img');
  image.className = 'product-card__image';
  image.src = productImageUrl(item);
  image.alt = productImageAlt(item);
  image.loading = 'lazy';
  image.width = 400;
  image.height = 300;

  let imageErrorHandled = false;
  image.addEventListener('error', (event) => {
    if (imageErrorHandled) {
      return;
    }
    imageErrorHandled = true;
    image.src = productImageUrl({});
    image.dataset.imageError = 'true';
    onImageError?.(product, event);
  });

  const body = document.createElement('div');
  body.className = 'product-card__body';

  const name = document.createElement('h3');
  name.className = 'product-card__name';
  name.textContent = typeof item.name === 'string' ? item.name : '';

  const price = document.createElement('p');
  price.className = 'product-card__price';
  price.textContent =
    typeof item.price === 'number' && typeof item.currency === 'string'
      ? formatCurrency(item.price, item.currency)
      : '';

  const rating = document.createElement('p');
  rating.className = 'product-card__rating';
  const ratingCount = typeof item.ratings_count === 'number' ? item.ratings_count : 0;
  const averageRating =
    typeof item.average_rating === 'number' && Number.isFinite(item.average_rating)
      ? item.average_rating
      : 0;
  rating.textContent =
    ratingCount > 0 ? `★ ${averageRating.toFixed(1)} (${ratingCount})` : 'No ratings yet';

  const stock = document.createElement('p');
  stock.className = 'product-card__stock';
  stock.textContent =
    typeof item.stock === 'number' && item.stock > 0
      ? `In stock: ${item.stock}`
      : item.stock === 0
        ? 'Out of stock'
        : '';

  body.append(name, price, rating, stock);
  article.append(image, body);
  return article;
}
