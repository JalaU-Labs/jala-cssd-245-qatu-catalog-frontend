import { describe, expect, it } from 'vitest';
import { formatCurrency, formatNumber } from './format.js';

describe('formatCurrency', () => {
  it('formats USD currency', () => {
    expect(formatCurrency(199.99, 'USD')).toBe('$199.99');
  });

  it('formats BOB using the locale currency representation', () => {
    const expected = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BOB',
    }).format(1000);

    expect(formatCurrency(1000, 'BOB')).toBe(expected);
  });

  it('falls back to USD for an invalid currency code', () => {
    const expected = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(199.99);

    expect(formatCurrency(199.99, 'INVALID')).toBe(expected);
  });

  it('returns an em dash for a non-finite amount', () => {
    expect(formatCurrency(Number.NaN, 'USD')).toBe('—');
  });
});

describe('formatNumber', () => {
  it('formats numbers with an en-US thousands separator', () => {
    expect(formatNumber(1234)).toBe('1,234');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('returns an em dash for a non-finite number', () => {
    expect(formatNumber(Number.NaN)).toBe('—');
  });
});
