/** @file Product and pagination domain types (JSDoc only). */

/**
 * @typedef {Object} Product
 * @property {string} id - Unique product identifier.
 * @property {string} seller_id - Identifier of the owning seller.
 * @property {string | null} category_id - Product category identifier.
 * @property {string} name - Product display name.
 * @property {string} slug - URL-friendly product identifier.
 * @property {string | null} description - Product description.
 * @property {number} price - Price in the specified currency.
 * @property {Currency} currency - ISO 4217 currency code.
 * @property {number} stock - Available inventory count.
 * @property {Object<string, unknown>} attributes - Additional product attributes.
 * @property {string | null} primary_image_path - Path to the primary product image.
 * @property {'draft' | 'published' | 'unpublished' | 'archived'} state - Product lifecycle state.
 * @property {number} average_rating - Average product rating.
 * @property {number} ratings_count - Number of product ratings.
 * @property {string | null} published_at - Publication timestamp.
 * @property {string} created_at - Product creation timestamp.
 * @property {string} updated_at - Product update timestamp.
 */

/** @typedef {'USD' | 'EUR' | 'BOB' | 'PEN' | 'ARS' | 'COP' | 'MXN' | 'BRL'} Currency */

/**
 * @typedef {Object} PaginationMeta
 * @property {number} page - Current 1-indexed page.
 * @property {number} per_page - Maximum number of results per page.
 * @property {number} total - Total matching product count.
 * @property {number} total_pages - Number of pages available.
 */

/**
 * @typedef {Object} ProductListEnvelope
 * @property {Product[]} data - Products on the current page.
 * @property {PaginationMeta} meta - Pagination metadata.
 */

/**
 * @typedef {Object} ApiErrorBody
 * @property {{ code: string, message: string, details?: Array<{ field?: string, message: string }> }} error - Error payload.
 * @property {{ timestamp: string }=} meta - Response metadata.
 */

export {};
