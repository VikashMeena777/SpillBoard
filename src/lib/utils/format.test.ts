import { describe, expect, it } from 'vitest';
import { compactNumber, editionNumber, fullDate, timeAgo } from './format';

describe('compactNumber', () => {
  it.each([
    [0, '0'],
    [42, '42'],
    [999, '999'],
    [1000, '1k'],
    [1500, '1.5k'],
    [12840, '12.8k'],
    [1_000_000, '1M'],
    [2_500_000, '2.5M'],
  ])('formats %i as %s', (input, expected) => {
    expect(compactNumber(input)).toBe(expected);
  });

  it('handles negatives', () => {
    expect(compactNumber(-1500)).toBe('-1.5k');
  });

  it('coerces non-numeric input to 0 instead of printing NaN', () => {
    expect(compactNumber(Number.NaN)).toBe('0');
  });
});

describe('timeAgo', () => {
  /*
   * Regression: the old cards passed created_at straight into date-fns, which
   * throws on an unparseable string and would take down the entire feed render.
   */
  it('returns a fallback for an invalid date rather than throwing', () => {
    expect(() => timeAgo('not-a-date')).not.toThrow();
    expect(timeAgo('not-a-date')).toBe('just now');
  });

  it('abbreviates units in newsroom shorthand', () => {
    const fourHoursAgo = new Date(Date.now() - 4 * 3_600_000).toISOString();
    expect(timeAgo(fourHoursAgo)).toBe('4h ago');
  });

  it('always ends with "ago"', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString();
    expect(timeAgo(threeDaysAgo)).toMatch(/ago$/);
  });
});

describe('fullDate', () => {
  it('returns an empty string for an invalid date', () => {
    expect(fullDate('nonsense')).toBe('');
  });

  it('produces a non-empty string for a valid date', () => {
    expect(fullDate(new Date().toISOString()).length).toBeGreaterThan(0);
  });
});

describe('editionNumber', () => {
  it('is zero-padded to four digits', () => {
    expect(editionNumber(new Date('2024-01-05T00:00:00.000Z'))).toMatch(/^\d{4}$/);
  });

  it('increases with later dates', () => {
    const earlier = editionNumber(new Date('2024-06-01T00:00:00.000Z'));
    const later = editionNumber(new Date('2025-06-01T00:00:00.000Z'));
    expect(Number(later)).toBeGreaterThan(Number(earlier));
  });

  it('never returns a value below 1', () => {
    expect(Number(editionNumber(new Date('2020-01-01T00:00:00.000Z')))).toBeGreaterThanOrEqual(1);
  });
});
