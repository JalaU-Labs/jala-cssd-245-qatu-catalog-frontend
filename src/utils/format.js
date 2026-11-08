/**
 * Formats a finite amount as currency, defaulting to USD for invalid currency codes.
 *
 * @param {number} amount Amount to format.
 * @param {string} [currency] ISO 4217 currency code.
 * @returns {string} Formatted currency or an em dash for non-finite amounts.
 */
export function formatCurrency(amount, currency) {
  if (!Number.isFinite(amount)) {
    return '—';
  }

  const requestedCurrency = currency?.trim() || 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: requestedCurrency,
    }).format(amount);
  } catch {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    } catch {
      return String(amount);
    }
  }
}

/**
 * Formats a finite number using en-US grouping conventions.
 *
 * @param {number} value Number to format.
 * @returns {string} Formatted number or an em dash for non-finite values.
 */
export function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return '—';
  }

  return new Intl.NumberFormat('en-US').format(value);
}
