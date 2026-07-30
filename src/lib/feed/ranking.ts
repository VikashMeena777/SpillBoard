import type { Confession, Category, FeedTab } from '@/types';
import { LIMITS } from '@/lib/constants';

/**
 * Feed ranking, defined once.
 *
 * The old build implemented "hot" twice with different formulas — the API route
 * used `upvotes + tea_score` while the service used `upvotes + tea_score * 2` —
 * so the same tab produced different orders depending on which code path served
 * the request.
 */

/** Half-life in hours: how fast heat decays so the feed keeps turning over. */
const HOT_HALF_LIFE_HOURS = 18;

function ageInHours(iso: string, now: number): number {
  const created = new Date(iso).getTime();
  if (!Number.isFinite(created)) return Number.MAX_SAFE_INTEGER;
  return Math.max(0, (now - created) / 3_600_000);
}

/**
 * Gravity-decayed heat score. Engagement counts for more than raw AI score, and
 * everything fades with age, so a week-old nuclear spill does not pin the front
 * page forever.
 */
export function hotScore(c: Confession, now: number = Date.now()): number {
  const engagement =
    c.upvotes * 2 -
    c.downvotes * 3 +
    c.comment_count * 4 +
    Object.values(c.reaction_counts ?? {}).reduce((sum, n) => sum + (n || 0), 0);

  const quality = c.tea_score * 1.5;
  const decay = Math.pow(0.5, ageInHours(c.created_at, now) / HOT_HALF_LIFE_HOURS);

  return (engagement + quality) * decay;
}

export interface SortOptions {
  tab: FeedTab;
  category?: Category | 'all';
  /** Only used by the 'city' tab. */
  city?: string | null;
  limit?: number;
  now?: number;
}

/**
 * Filter + sort a confession list. Pure and total: safe to unit test and safe to
 * call on either side of the network boundary.
 */
export function rankConfessions(
  input: readonly Confession[],
  { tab, category = 'all', city, limit = LIMITS.feedPageSize, now = Date.now() }: SortOptions,
): Confession[] {
  let list = [...input];

  if (category !== 'all') {
    list = list.filter((c) => c.category === category);
  }

  if (tab === 'city') {
    /*
     * The old 'city' tab filtered for a non-empty city, but every confession was
     * written with city: 'Global', making the filter a no-op that returned the
     * whole feed. It now requires an actual city match and excludes the
     * 'Global' sentinel.
     */
    const target = city?.trim().toLowerCase();
    list = list.filter((c) => {
      const value = c.city?.trim().toLowerCase();
      if (!value || value === 'global') return false;
      return target ? value === target : true;
    });
  }

  switch (tab) {
    case 'hot':
      list.sort((a, b) => hotScore(b, now) - hotScore(a, now));
      break;
    case 'fresh':
    case 'city':
      list.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      break;
    case 'top':
      /* Tie-break on upvotes so equal scores have a stable order. */
      list.sort((a, b) => b.tea_score - a.tea_score || b.upvotes - a.upvotes);
      break;
  }

  return list.slice(0, limit);
}

/** Net vote total, used by cards and the leaderboard. */
export function netVotes(c: Confession): number {
  return (c.upvotes ?? 0) - (c.downvotes ?? 0);
}

/** Sum of all six reaction buckets. */
export function totalReactions(c: Confession): number {
  return Object.values(c.reaction_counts ?? {}).reduce((sum, n) => sum + (n || 0), 0);
}
