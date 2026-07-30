import { describe, expect, it } from 'vitest';
import type { Confession } from '@/types';
import { hotScore, netVotes, rankConfessions, totalReactions } from './ranking';

const HOUR = 3_600_000;
const NOW = new Date('2026-01-15T12:00:00.000Z').getTime();

function make(overrides: Partial<Confession> & { id: string }): Confession {
  return {
    user_id: 'user-1',
    anon_handle_snapshot: 'TestByline_100',
    body: 'A perfectly ordinary confession about a matcha tin.',
    category: 'petty',
    tea_score: 50,
    tea_temperature: '☕ Warm Tea',
    ai_verdict: 'Mildly amusing.',
    ai_vibe_tag: 'Cope Arc',
    reaction_counts: { tea: 0, spicy: 0, dead: 0, yikes: 0, red_flag: 0, iconic: 0 },
    upvotes: 0,
    downvotes: 0,
    comment_count: 0,
    created_at: new Date(NOW - HOUR).toISOString(),
    ...overrides,
  };
}

describe('hotScore', () => {
  it('ranks a more upvoted confession higher at equal age', () => {
    const popular = make({ id: 'a', upvotes: 100 });
    const quiet = make({ id: 'b', upvotes: 5 });
    expect(hotScore(popular, NOW)).toBeGreaterThan(hotScore(quiet, NOW));
  });

  it('decays with age so old spills do not pin the front page', () => {
    const fresh = make({ id: 'a', upvotes: 50, created_at: new Date(NOW - HOUR).toISOString() });
    const old = make({
      id: 'b',
      upvotes: 50,
      created_at: new Date(NOW - HOUR * 24 * 7).toISOString(),
    });
    expect(hotScore(fresh, NOW)).toBeGreaterThan(hotScore(old, NOW));
  });

  it('penalises downvotes', () => {
    const clean = make({ id: 'a', upvotes: 20 });
    const contested = make({ id: 'b', upvotes: 20, downvotes: 15 });
    expect(hotScore(clean, NOW)).toBeGreaterThan(hotScore(contested, NOW));
  });

  it('does not throw on an unparseable timestamp', () => {
    expect(() => hotScore(make({ id: 'a', created_at: 'not-a-date' }), NOW)).not.toThrow();
  });
});

describe('rankConfessions', () => {
  const list = [
    make({ id: 'low', tea_score: 10, upvotes: 1, category: 'work' }),
    make({ id: 'high', tea_score: 99, upvotes: 4, category: 'petty' }),
    make({ id: 'mid', tea_score: 55, upvotes: 900, category: 'work' }),
  ];

  it('sorts the top tab by score', () => {
    const result = rankConfessions(list, { tab: 'top', now: NOW });
    expect(result.map((c) => c.id)).toEqual(['high', 'mid', 'low']);
  });

  it('sorts the fresh tab by recency', () => {
    const timed = [
      make({ id: 'older', created_at: new Date(NOW - HOUR * 5).toISOString() }),
      make({ id: 'newest', created_at: new Date(NOW - HOUR).toISOString() }),
    ];
    expect(rankConfessions(timed, { tab: 'fresh', now: NOW })[0]?.id).toBe('newest');
  });

  it('weights engagement over raw score on the hot tab', () => {
    /* 'mid' has a mediocre score but overwhelming votes. */
    expect(rankConfessions(list, { tab: 'hot', now: NOW })[0]?.id).toBe('mid');
  });

  it('filters by category', () => {
    const result = rankConfessions(list, { tab: 'top', category: 'work', now: NOW });
    expect(result.map((c) => c.id)).toEqual(['mid', 'low']);
  });

  it('respects the limit', () => {
    expect(rankConfessions(list, { tab: 'top', limit: 2, now: NOW })).toHaveLength(2);
  });

  it('does not mutate its input', () => {
    const original = list.map((c) => c.id);
    rankConfessions(list, { tab: 'top', now: NOW });
    expect(list.map((c) => c.id)).toEqual(original);
  });

  it('returns an empty array for empty input', () => {
    expect(rankConfessions([], { tab: 'hot', now: NOW })).toEqual([]);
  });

  describe('city tab', () => {
    /*
     * Regression: the old filter only checked for a non-empty city, but every
     * confession was created with city: 'Global', so the tab returned the entire
     * feed instead of local spills.
     */
    const cityList = [
      make({ id: 'global', city: 'Global' }),
      make({ id: 'none' }),
      make({ id: 'mumbai', city: 'Mumbai' }),
      make({ id: 'berlin', city: 'Berlin' }),
    ];

    it('excludes the Global sentinel and untagged spills', () => {
      const ids = rankConfessions(cityList, { tab: 'city', now: NOW }).map((c) => c.id);
      expect(ids).not.toContain('global');
      expect(ids).not.toContain('none');
      expect(ids).toHaveLength(2);
    });

    it('matches a specific city case-insensitively', () => {
      const ids = rankConfessions(cityList, { tab: 'city', city: 'mumbai', now: NOW }).map(
        (c) => c.id,
      );
      expect(ids).toEqual(['mumbai']);
    });
  });
});

describe('netVotes / totalReactions', () => {
  it('computes the net vote total', () => {
    expect(netVotes(make({ id: 'a', upvotes: 10, downvotes: 4 }))).toBe(6);
  });

  it('sums every reaction bucket', () => {
    const c = make({
      id: 'a',
      reaction_counts: { tea: 1, spicy: 2, dead: 3, yikes: 4, red_flag: 5, iconic: 6 },
    });
    expect(totalReactions(c)).toBe(21);
  });
});
