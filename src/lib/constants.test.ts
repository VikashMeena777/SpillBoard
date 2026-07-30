import { describe, expect, it } from 'vitest';
import {
  CATEGORIES,
  CATEGORY_MAP,
  clampScore,
  getCategory,
  getTier,
  getTierByLabel,
  NUCLEAR_THRESHOLD,
  REACTIONS,
  TIERS,
} from './constants';

describe('clampScore', () => {
  it.each([
    [-50, 0],
    [0, 0],
    [50, 50],
    [100, 100],
    [150, 100],
  ])('clamps %i to %i', (input, expected) => {
    expect(clampScore(input)).toBe(expected);
  });

  it('rounds fractional scores', () => {
    expect(clampScore(72.6)).toBe(73);
  });

  it('returns 0 for non-finite values', () => {
    expect(clampScore(Number.NaN)).toBe(0);
    expect(clampScore(Number.POSITIVE_INFINITY)).toBe(100);
  });
});

describe('getTier', () => {
  it.each([
    [0, 'ice'],
    [20, 'ice'],
    [21, 'luke'],
    [40, 'luke'],
    [41, 'warm'],
    [60, 'warm'],
    [61, 'hot'],
    [80, 'hot'],
    [81, 'spicy'],
    [95, 'spicy'],
    [96, 'nuclear'],
    [100, 'nuclear'],
  ])('maps %i to the %s tier', (score, key) => {
    expect(getTier(score).key).toBe(key);
  });

  /*
   * Regression: three separate ladders disagreed. The card's getMeterClass and
   * getScoreColor both switched to nuclear at >=90, while the type scale and the
   * AI prompt reserved NUCLEAR for >=96.
   */
  it('does not treat 90 as nuclear', () => {
    expect(getTier(90).key).toBe('spicy');
  });

  it('agrees with NUCLEAR_THRESHOLD', () => {
    expect(getTier(NUCLEAR_THRESHOLD).key).toBe('nuclear');
    expect(getTier(NUCLEAR_THRESHOLD - 1).key).not.toBe('nuclear');
  });

  it('clamps out-of-range input instead of returning undefined', () => {
    expect(getTier(-10).key).toBe('ice');
    expect(getTier(999).key).toBe('nuclear');
  });
});

describe('TIERS', () => {
  it('covers 0-100 with no gaps or overlaps', () => {
    expect(TIERS[0]?.min).toBe(0);
    expect(TIERS[TIERS.length - 1]?.max).toBe(100);

    for (let i = 1; i < TIERS.length; i += 1) {
      expect(TIERS[i]!.min).toBe(TIERS[i - 1]!.max + 1);
    }
  });

  it('round-trips through getTierByLabel', () => {
    for (const tier of TIERS) {
      expect(getTierByLabel(tier.label).key).toBe(tier.key);
    }
  });
});

describe('categories', () => {
  it('exposes a unique key per category', () => {
    expect(new Set(CATEGORIES.map((c) => c.key)).size).toBe(CATEGORIES.length);
  });

  it('indexes every category in CATEGORY_MAP', () => {
    for (const category of CATEGORIES) {
      expect(CATEGORY_MAP[category.key]).toBe(category);
    }
  });

  it('falls back to a real category for unknown input', () => {
    expect(getCategory('not-a-desk').key).toBe(CATEGORIES[0]!.key);
    expect(getCategory(undefined).key).toBe(CATEGORIES[0]!.key);
  });
});

describe('reactions', () => {
  it('defines exactly six reactions with accessible labels', () => {
    expect(REACTIONS).toHaveLength(6);
    for (const reaction of REACTIONS) {
      expect(reaction.label.length).toBeGreaterThan(0);
    }
  });
});
