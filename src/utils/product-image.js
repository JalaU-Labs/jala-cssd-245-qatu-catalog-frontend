/**
 * Creates a deterministic remote image URL for a product.
 *
 * @param {{ id?: unknown }} [product] Product-like object.
 * @param {{ width?: number, height?: number }} [options] Image dimensions.
 * @returns {string} Deterministic image URL.
 * @throws {never} This function does not throw for missing product identifiers.
 */
export function productImageUrl(product, { width = 400, height = 300 } = {}) {
  const id = product && typeof product.id === 'string' ? product.id : undefined;
  if (id === undefined) {
    return `https://picsum.photos/seed/fallback-${width}x${height}/${width}/${height}`;
  }

  let hash = 0x811c9dc5;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `https://picsum.photos/seed/${hash >>> 0}-${width}x${height}/${width}/${height}`;
}

/**
 * Returns accessible alternative text for a product image.
 *
 * @param {{ name?: unknown } | null} [product] Product-like object.
 * @returns {string} Trimmed product name or a generic image description.
 * @throws {never} This function does not throw for missing names.
 */
export function productImageAlt(product) {
  return typeof product?.name === 'string' && product.name.trim()
    ? product.name.trim()
    : 'Product image';
}
