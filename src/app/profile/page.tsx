'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { Confession } from '@/types';
import { cn } from '@/lib/utils/cn';
import { BADGES } from '@/lib/constants';
import { compactNumber } from '@/lib/utils/format';
import { handleGlyph, MAX_REROLLS_PER_DAY } from '@/lib/utils/anon-handles';
import { useFeed } from '@/lib/hooks/useFeed';
import { useProfile } from '@/lib/hooks/useProfile';
import { ConfessionCard } from '@/components/feed/ConfessionCard';
import { ShareCard } from '@/components/feed/ShareCard';
import { Button } from '@/components/ui/Button';
import {
  ConfessionSkeleton,
  EmptyState,
  Kicker,
  SectionHeading,
  Skeleton,
} from '@/components/ui/Primitives';

/**
 * My Desk.
 *
 * The old page read INITIAL_PROFILE directly, showed `INITIAL_CONFESSIONS.slice(0, 2)`
 * as "your" confessions regardless of who filed them, rerolled the handle purely
 * in local state with a cap of 1 that contradicted the type, and passed no-op
 * onReact/onVote so the cards looked interactive but recorded nothing.
 */
export default function ProfilePage() {
  const { profile, loading, rerolling, reroll } = useProfile();
  /* `mine` asks the server for this visitor's own filings only. */
  const feed = useFeed({ initialTab: 'fresh', mine: true });
  const [shareTarget, setShareTarget] = useState<Confession | null>(null);

  const rerollsLeft = profile ? Math.max(0, MAX_REROLLS_PER_DAY - profile.handle_rerolls_today) : 0;

  async function handleReroll() {
    const error = await reroll();
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('New byline issued.');
  }

  const unlocked = new Set(profile?.badges ?? []);

  return (
    <>
      <div className="mx-auto w-full max-w-broadsheet px-4 py-10">
        {/* ---- Identity ---- */}
        <section className="paper-block p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <span
                aria-hidden
                className="flex size-16 shrink-0 items-center justify-center border-2 border-ink bg-paper-sunk text-3xl"
              >
                {profile ? handleGlyph(profile.anon_handle) : '🎭'}
              </span>

              <div className="min-w-0">
                <Kicker as="p">Your byline</Kicker>

                {loading || !profile ? (
                  <Skeleton className="mt-1.5 h-8 w-56" />
                ) : (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-3xl leading-none">
                      @{profile.anon_handle}
                    </h1>

                    <button
                      type="button"
                      onClick={handleReroll}
                      disabled={rerolling || rerollsLeft === 0}
                      /* Icon-only controls need a real accessible name; the old
                       * one had only a title attribute. */
                      aria-label={
                        rerollsLeft === 0
                          ? 'No byline changes left today'
                          : `Change byline. ${rerollsLeft} of ${MAX_REROLLS_PER_DAY} left today`
                      }
                      className="inline-flex size-8 items-center justify-center border-2 border-ink bg-paper-sunk text-ink transition hover:bg-marker hover:text-marker-ink disabled:opacity-40"
                    >
                      <RefreshCw
                        aria-hidden
                        className={cn('size-3.5', rerolling && 'animate-spin')}
                      />
                    </button>
                  </div>
                )}

                <p className="kicker mt-1.5 text-ink-faint">
                  {rerollsLeft} of {MAX_REROLLS_PER_DAY} byline changes left today
                </p>
              </div>
            </div>

            {/* ---- Stats ---- */}
            <dl className="grid grid-cols-3 gap-2">
              {[
                { label: 'Karma', value: profile ? compactNumber(profile.karma) : '—' },
                { label: 'Streak', value: profile ? `${profile.streak_days}d` : '—' },
                { label: 'Filings', value: compactNumber(feed.confessions.length) },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="border-2 border-ink bg-paper-sunk px-4 py-3 text-center"
                >
                  <dd className="font-display text-2xl leading-none">{stat.value}</dd>
                  <dt className="kicker mt-1 text-ink-faint">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          {profile && !profile.is_premium && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink/15 pt-5">
              <p className="font-body text-sm text-ink-soft">
                You are on the free tier. Press Pass removes watermarks and the daily filing cap.
              </p>
              <Link href="/pricing">
                <Button size="sm" variant="marker">
                  Get a Press Pass
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* ---- Badges ---- */}
        <section aria-labelledby="badges" className="mt-10">
          <SectionHeading kicker="Earned on the record">
            <span id="badges">Commendations</span>
          </SectionHeading>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BADGES.map((badge) => {
              const has = unlocked.has(badge.key);
              return (
                <li
                  key={badge.key}
                  className={cn(
                    'flex items-start gap-3 border-2 p-4',
                    has
                      ? 'border-ink bg-paper-raised shadow-stamp'
                      : 'border-dashed border-ink/30 bg-transparent',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn('text-2xl leading-none', !has && 'opacity-35 grayscale')}
                  >
                    {badge.emoji}
                  </span>

                  <div className="min-w-0">
                    <p
                      className={cn(
                        'flex items-center gap-1.5 font-display text-lg uppercase leading-none',
                        !has && 'text-ink-faint',
                      )}
                    >
                      {badge.label}
                      {has && <CheckCircle2 aria-hidden className="size-3.5 text-success" />}
                      {/* Text alternative, since the icon alone is not announced. */}
                      <span className="sr-only">{has ? '(earned)' : '(locked)'}</span>
                    </p>
                    <p
                      className={cn(
                        'mt-1 font-body text-sm leading-snug',
                        has ? 'text-ink-muted' : 'text-ink-faint',
                      )}
                    >
                      {badge.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ---- Own filings ---- */}
        <section aria-labelledby="my-filings" className="mt-12">
          <SectionHeading kicker="Everything you put on the record">
            <span id="my-filings">Your Filings</span>
          </SectionHeading>

          <div className="flex flex-col gap-5">
            {feed.loading ? (
              Array.from({ length: 2 }).map((_, i) => <ConfessionSkeleton key={i} />)
            ) : feed.confessions.length === 0 ? (
              <EmptyState
                emoji="🗒️"
                title="Nothing on the record"
                action={
                  <Link href="/spill">
                    <Button variant="marker">File your first spill</Button>
                  </Link>
                }
              >
                Your filings appear here once you send something to the editor.
              </EmptyState>
            ) : (
              feed.confessions.map((c, i) => (
                <ConfessionCard
                  key={c.id}
                  confession={c}
                  index={i}
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
