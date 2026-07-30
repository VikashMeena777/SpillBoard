'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Confession } from '@/types';
import { useFeed } from '@/lib/hooks/useFeed';
import { useProfile } from '@/lib/hooks/useProfile';
import { cn } from '@/lib/utils/cn';
import { getTier, NUCLEAR_THRESHOLD } from '@/lib/constants';
import { compactNumber } from '@/lib/utils/format';
import { handleGlyph } from '@/lib/utils/anon-handles';
import { ConfessionCard } from '@/components/feed/ConfessionCard';
import { ShareCard } from '@/components/feed/ShareCard';
import { Button } from '@/components/ui/Button';
import {
  ConfessionSkeleton,
  EmptyState,
  Kicker,
  SectionHeading,
} from '@/components/ui/Primitives';

/**
 * Hall of Shame.
 *
 * Everything here is derived from the live feed. The old page hardcoded a
 * five-entry spiller table that contradicted the four-entry version in the
 * sidebar, and titled a section "Nuclear Tier Confessions (90+°F)" while
 * rendering all five mocks including a 64°F one.
 */
export default function LeaderboardPage() {
  /* 'top' ranks by score, which is what a hall of shame is. */
  const feed = useFeed({ initialTab: 'top' });
  const { profile } = useProfile();
  const [shareTarget, setShareTarget] = useState<Confession | null>(null);

  /* Aggregate bylines from actual filings rather than a fixed list. */
  const bylines = Object.values(
    feed.confessions.reduce<
      Record<string, { handle: string; karma: number; best: number; filings: number; city?: string }>
    >((acc, c) => {
      const entry = acc[c.anon_handle_snapshot] ?? {
        handle: c.anon_handle_snapshot,
        karma: 0,
        best: 0,
        filings: 0,
        city: c.city,
      };
      entry.karma += c.upvotes;
      entry.best = Math.max(entry.best, c.tea_score);
      entry.filings += 1;
      acc[c.anon_handle_snapshot] = entry;
      return acc;
    }, {}),
  )
    .sort((a, b) => b.karma - a.karma || b.best - a.best)
    .slice(0, 10);

  /* Only genuinely nuclear filings belong under a nuclear heading. */
  const nuclear = feed.confessions.filter((c) => c.tea_score >= NUCLEAR_THRESHOLD);
  const archive = nuclear.length > 0 ? nuclear : feed.confessions.slice(0, 5);

  return (
    <>
      <div className="mx-auto w-full max-w-broadsheet px-4 py-10">
        {/* ---- Masthead ---- */}
        <header className="border-b-2 border-ink pb-6 text-center">
          <Kicker as="p">The permanent record</Kicker>
          <h1 className="misprint mt-3 font-display text-display-sm uppercase leading-[0.86] sm:text-display-md">
            Hall of Shame
          </h1>
          <p className="mx-auto mt-4 max-w-column font-body text-lg text-ink-soft">
            The highest-scoring filings and the bylines behind them. Ranked by what readers
            actually voted for.
          </p>
        </header>

        {/* ---- Bylines table ---- */}
        <section aria-labelledby="bylines" className="mt-10">
          <SectionHeading kicker="Ranked by reader votes">
            <span id="bylines">Top Bylines</span>
          </SectionHeading>

          {feed.loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse-rule bg-ink/10" />
              ))}
            </div>
          ) : bylines.length === 0 ? (
            <EmptyState emoji="🏚️" title="Nobody has filed yet">
              The record is empty. Someone has to go first.
            </EmptyState>
          ) : (
            <ol className="paper-block divide-y-2 divide-ink/10">
              {bylines.map((byline, i) => {
                const tier = getTier(byline.best);
                const podium = i < 3;

                return (
                  <li
                    key={byline.handle}
                    data-tier={tier.key}
                    className={cn(
                      'flex items-center justify-between gap-4 p-4',
                      podium && 'bg-paper-sunk',
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {/* Rank: solid ink for the podium, outline below it. */}
                      <span
                        aria-hidden
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center border-2 border-ink font-display text-xl leading-none',
                          i === 0
                            ? 'bg-marker text-marker-ink'
                            : podium
                              ? 'bg-ink text-paper'
                              : 'text-ink-muted',
                        )}
                      >
                        {i + 1}
                      </span>

                      <span aria-hidden className="hidden text-lg sm:inline">
                        {handleGlyph(byline.handle)}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm font-bold">@{byline.handle}</p>
                        <p className="kicker mt-0.5 text-ink-faint">
                          {byline.filings} {byline.filings === 1 ? 'filing' : 'filings'} · best{' '}
                          <span className="tier-text">{byline.best}°F</span>
                          {byline.city ? ` · ${byline.city}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-display text-2xl leading-none">
                        {compactNumber(byline.karma)}
                      </p>
                      <Kicker as="p" className="text-ink-faint">
                        Tea votes
                      </Kicker>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* ---- Archive ---- */}
        <section aria-labelledby="archive" className="mt-12">
          <SectionHeading
            kicker={
              nuclear.length > 0
                ? `Scored ${NUCLEAR_THRESHOLD}°F and above`
                : 'Highest scored on record'
            }
          >
            <span id="archive">{nuclear.length > 0 ? 'Nuclear Archive' : 'Top Filings'}</span>
          </SectionHeading>

          <div className="flex flex-col gap-5">
            {feed.loading ? (
              Array.from({ length: 3 }).map((_, i) => <ConfessionSkeleton key={i} />)
            ) : archive.length === 0 ? (
              <EmptyState
                emoji="☢️"
                title="No nuclear filings yet"
                action={
                  <Link href="/spill">
                    <Button variant="marker">File something worse</Button>
                  </Link>
                }
              >
                Nothing has cleared {NUCLEAR_THRESHOLD}°F. The editor is not impressed.
              </EmptyState>
            ) : (
              archive.map((c, i) => (
                <ConfessionCard
                  key={c.id}
                  confession={c}
                  index={i}
                  rank={i + 1}
                  onReact={feed.react}
                  onVote={feed.vote}
                  onShare={setShareTarget}
                />
              ))
            )}
          </div>
        </section>
      </div>

      <ShareCard
        confession={shareTarget}
        onClose={() => setShareTarget(null)}
        isPremium={profile?.is_premium}
      />
    </>
  );
}
