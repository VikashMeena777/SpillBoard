'use client';

import Link from 'next/link';
import type { Category, Confession } from '@/types';
import { cn } from '@/lib/utils/cn';
import { CATEGORIES, getTier } from '@/lib/constants';
import { compactNumber } from '@/lib/utils/format';
import { Button } from '@/components/ui/Button';
import { Kicker } from '@/components/ui/Primitives';

export interface SidebarProps {
  topConfessions: Confession[];
  selectedCategory: Category | 'all';
  onSelectCategory: (category: Category | 'all') => void;
}

/**
 * Right rail: desk index, the nuclear column, and the subscription house ad.
 *
 * The old sidebar hardcoded a four-entry "Top Spillers" list that duplicated a
 * five-entry version on the leaderboard page with different numbers. Derived
 * data now comes from the confessions actually passed in, so the rail cannot
 * contradict the feed.
 */
export function Sidebar({ topConfessions, selectedCategory, onSelectCategory }: SidebarProps) {
  /* Rank bylines by the heat they actually earned, rather than a fixed list. */
  const topSpillers = Object.values(
    topConfessions.reduce<Record<string, { handle: string; karma: number; best: number }>>(
      (acc, c) => {
        const entry = acc[c.anon_handle_snapshot] ?? {
          handle: c.anon_handle_snapshot,
          karma: 0,
          best: 0,
        };
        entry.karma += c.upvotes;
        entry.best = Math.max(entry.best, c.tea_score);
        acc[c.anon_handle_snapshot] = entry;
        return acc;
      },
      {},
    ),
  )
    .sort((a, b) => b.karma - a.karma)
    .slice(0, 5);

  const nuclear = [...topConfessions]
    .sort((a, b) => b.tea_score - a.tea_score)
    .slice(0, 3);

  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-80">
      {/* ---- Desk index ---- */}
      <section aria-labelledby="desk-index" className="paper-block p-5">
        <h2 id="desk-index" className="font-display text-2xl leading-none">
          Desk Index
        </h2>
        <div className="rule-double my-3" />

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            aria-pressed={selectedCategory === 'all'}
            className={cn(
              'border-2 px-2.5 py-1 font-mono text-xs font-bold uppercase transition',
              selectedCategory === 'all'
                ? 'border-ink bg-ink text-paper'
                : 'border-ink/25 text-ink-soft hover:border-ink hover:text-ink',
            )}
          >
            🍵 All
          </button>

          {CATEGORIES.map((category) => {
            const active = selectedCategory === category.key;
            return (
              <button
                key={category.key}
                type="button"
                onClick={() => onSelectCategory(category.key)}
                aria-pressed={active}
                className={cn(
                  'inline-flex items-center gap-1 border-2 px-2.5 py-1 font-mono text-xs font-bold uppercase transition',
                  active
                    ? 'border-ink bg-marker text-marker-ink'
                    : 'border-ink/25 text-ink-soft hover:border-ink hover:text-ink',
                )}
              >
                <span aria-hidden>{category.emoji}</span>
                {category.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ---- Nuclear column ---- */}
      {nuclear.length > 0 && (
        <section aria-labelledby="nuclear-column" className="paper-block p-5">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="nuclear-column" className="font-display text-2xl leading-none">
              Hottest Filed
            </h2>
            <Link
              href="/leaderboard"
              className="kicker text-ink-muted underline-offset-2 hover:text-ink hover:underline"
            >
              All →
            </Link>
          </div>
          <div className="rule-double my-3" />

          <ol className="flex flex-col">
            {nuclear.map((item, i) => {
              const tier = getTier(item.tea_score);
              return (
                <li key={item.id} data-tier={tier.key}>
                  <Link
                    href={`/confession/${item.id}`}
                    className={cn(
                      'group block py-3',
                      i > 0 && 'border-t border-ink/15',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="tier-text font-display text-lg leading-none">
                        {item.tea_score}°F
                      </span>
                      <span className="kicker truncate text-ink-faint">
                        @{item.anon_handle_snapshot}
                      </span>
                    </div>

                    <p className="mt-1.5 line-clamp-2 font-body text-sm leading-snug text-ink-soft group-hover:text-ink">
                      {item.title ?? item.body}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* ---- Bylines ---- */}
      {topSpillers.length > 0 && (
        <section aria-labelledby="top-bylines" className="paper-block p-5">
          <h2 id="top-bylines" className="font-display text-2xl leading-none">
            Top Bylines
          </h2>
          <div className="rule-double my-3" />

          <ol className="flex flex-col">
            {topSpillers.map((spiller, i) => (
              <li
                key={spiller.handle}
                className={cn(
                  'flex items-center justify-between gap-2 py-2.5',
                  i > 0 && 'border-t border-ink/15',
                )}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="w-5 shrink-0 font-display text-lg leading-none text-ink-faint">
                    {i + 1}
                  </span>
                  <p className="truncate font-mono text-xs font-bold">@{spiller.handle}</p>
                </div>

                <span className="kicker shrink-0 text-ink-muted">
                  {compactNumber(spiller.karma)} 🍵
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ---- House ad ---- */}
      <section
        aria-labelledby="house-ad"
        className="paper-block halftone-field border-3 p-5 text-center"
      >
        <Kicker as="p" className="text-ink-muted">
          Advertisement
        </Kicker>

        <h2 id="house-ad" className="mt-2 font-display text-3xl leading-[0.9]">
          Get a Press Pass
        </h2>

        <p className="mt-2 font-body text-sm leading-snug text-ink-soft">
          Unlimited filings, watermark-free cards, and a byline you can change whenever you like.
        </p>

        <Link href="/pricing" className="mt-4 block">
          <Button variant="primary" className="w-full">
            See the terms
          </Button>
        </Link>
      </section>
    </aside>
  );
}
