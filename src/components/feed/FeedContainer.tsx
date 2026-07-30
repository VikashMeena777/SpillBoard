'use client';

import type { Category, Confession, FeedTab, ReactionType } from '@/types';
import { cn } from '@/lib/utils/cn';
import { CATEGORIES, FEED_TABS } from '@/lib/constants';
import { ConfessionCard } from './ConfessionCard';
import { Button } from '@/components/ui/Button';
import { ConfessionSkeleton, EmptyState, Kicker } from '@/components/ui/Primitives';

export interface FeedContainerProps {
  confessions: Confession[];
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  selectedCategory: Category | 'all';
  /** Now actually wired: the old component received this prop and never used it. */
  onCategoryChange: (category: Category | 'all') => void;
  onReact: (confessionId: string, reaction: ReactionType) => void;
  onVote: (confessionId: string, vote: 1 | -1) => void;
  onShare: (confession: Confession) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function FeedContainer({
  confessions,
  activeTab,
  onTabChange,
  selectedCategory,
  onCategoryChange,
  onReact,
  onVote,
  onShare,
  loading = false,
  error = null,
  onRetry,
}: FeedContainerProps) {
  const activeTabMeta = FEED_TABS.find((t) => t.key === activeTab);

  return (
    <div className="flex w-full flex-col gap-6">
      {/* ---- Section tabs, as newspaper edition selectors ---- */}
      <div>
        <div
          role="tablist"
          aria-label="Feed section"
          className="flex overflow-x-auto border-2 border-ink bg-paper-raised"
        >
          {FEED_TABS.map((tab, i) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                type="button"
                aria-selected={active}
                title={tab.hint}
                onClick={() => onTabChange(tab.key)}
                className={cn(
                  'flex-1 whitespace-nowrap px-4 py-3 font-display text-lg uppercase leading-none transition',
                  i > 0 && 'border-l-2 border-ink',
                  active
                    ? 'bg-ink text-paper'
                    : 'text-ink-soft hover:bg-marker hover:text-marker-ink',
                )}
              >
                <span aria-hidden className="mr-1.5">
                  {tab.emoji}
                </span>
                {tab.label}
              </button>
            );
          })}
        </div>
        {activeTabMeta && (
          <Kicker as="p" className="mt-2 text-ink-faint">
            {activeTabMeta.hint}
          </Kicker>
        )}
      </div>

      {/* ---- Desk filter ---- */}
      <div>
        <Kicker as="p" className="mb-2">
          Filter by desk
        </Kicker>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onCategoryChange('all')}
            aria-pressed={selectedCategory === 'all'}
            className={cn(
              'border-2 px-3 py-1 font-mono text-xs font-bold uppercase transition',
              selectedCategory === 'all'
                ? 'border-ink bg-ink text-paper'
                : 'border-ink/25 text-ink-soft hover:border-ink hover:text-ink',
            )}
          >
            All Desks
          </button>

          {CATEGORIES.map((category) => {
            const active = selectedCategory === category.key;
            return (
              <button
                key={category.key}
                type="button"
                onClick={() => onCategoryChange(category.key)}
                aria-pressed={active}
                className={cn(
                  'inline-flex items-center gap-1.5 border-2 px-3 py-1 font-mono text-xs font-bold uppercase transition',
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
      </div>

      {/* ---- Results ---- */}
      {/* Announce load state changes without stealing focus. */}
      <div aria-live="polite" aria-busy={loading} className="flex flex-col gap-5">
        {loading ? (
          <>
            <span className="sr-only">Loading spills…</span>
            {Array.from({ length: 3 }).map((_, i) => (
              <ConfessionSkeleton key={i} />
            ))}
          </>
        ) : error ? (
          <EmptyState
            emoji="📵"
            title="The wire went down"
            action={
              onRetry && (
                <Button onClick={onRetry} variant="primary">
                  Try again
                </Button>
              )
            }
          >
            {error}
          </EmptyState>
        ) : confessions.length === 0 ? (
          <EmptyState
            emoji="🫗"
            title={activeTab === 'city' ? 'No local edition yet' : 'Nothing filed here'}
            action={
              <a href="/spill">
                <Button variant="marker">File the first spill</Button>
              </a>
            }
          >
            {activeTab === 'city'
              ? 'No spills have been tagged with a city yet. Add a location when you file to start the local edition.'
              : 'This desk is empty. Be the first to put something on the record.'}
          </EmptyState>
        ) : (
          confessions.map((confession, i) => (
            <ConfessionCard
              key={confession.id}
              confession={confession}
              index={i}
              /* The lead item gets front-page treatment on the hot tab. */
              featured={i === 0 && activeTab === 'hot'}
              onReact={onReact}
              onVote={onVote}
              onShare={onShare}
            />
          ))
        )}
      </div>
    </div>
  );
}
