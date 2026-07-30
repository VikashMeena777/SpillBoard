import { NextResponse } from 'next/server';
import type { Category, FeedTab } from '@/types';
import { CATEGORY_MAP, FEED_TABS, LIMITS } from '@/lib/constants';
import { rankConfessions } from '@/lib/feed/ranking';
import { listConfessions, withViewerState } from '@/lib/store/server-store';
import { attachAnonIdentity, getAnonIdentity } from '@/lib/auth/anon-session';

export const dynamic = 'force-dynamic';

const VALID_TABS = new Set(FEED_TABS.map((t) => t.key));

/**
 * GET /api/confessions?tab=hot&category=work&city=Mumbai
 *
 * This route previously existed but had no callers — the client imported the
 * service directly and ran everything in the browser. It is now the single read
 * path for the feed, and it shares `rankConfessions` with every other consumer
 * so ordering can no longer diverge.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const rawTab = searchParams.get('tab') ?? 'hot';
    const tab: FeedTab = (VALID_TABS.has(rawTab as FeedTab) ? rawTab : 'hot') as FeedTab;

    const rawCategory = searchParams.get('category');
    const category: Category | 'all' =
      rawCategory && rawCategory !== 'all' && rawCategory in CATEGORY_MAP
        ? (rawCategory as Category)
        : 'all';

    const city = searchParams.get('city');

    const identity = getAnonIdentity();

    /* `mine=1` returns only the caller's own filings, so the profile page does
     * not have to pull the whole feed and filter it in the browser. */
    const mineOnly = searchParams.get('mine') === '1';
    const source = mineOnly
      ? listConfessions().filter((c) => c.user_id === identity.id)
      : listConfessions();

    const ranked = rankConfessions(source, {
      tab,
      category,
      city,
      limit: LIMITS.feedPageSize,
    });

    const response = NextResponse.json(
      { confessions: withViewerState(ranked, identity.id), tab, category },
      { status: 200 },
    );

    return attachAnonIdentity(response, identity);
  } catch (err) {
    console.error('[GET /api/confessions]', err);
    return NextResponse.json({ error: 'Failed to load the feed.' }, { status: 500 });
  }
}
