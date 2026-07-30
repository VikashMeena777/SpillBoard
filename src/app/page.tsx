'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Confession, TeaRatingResult } from '@/types';
import { PenLine } from 'lucide-react';
import { useFeed } from '@/lib/hooks/useFeed';
import { useProfile } from '@/lib/hooks/useProfile';
import { TIERS } from '@/lib/constants';
import { FeedContainer } from '@/components/feed/FeedContainer';
import { Sidebar } from '@/components/layout/Sidebar';
import { ShareCard } from '@/components/feed/ShareCard';
import { SpillComposer } from '@/components/spill/SpillComposer';
import { VerdictReveal } from '@/components/spill/VerdictReveal';
import { Button } from '@/components/ui/Button';
import { Kicker } from '@/components/ui/Primitives';

export default function HomePage() {
  const feed = useFeed();
  const { profile } = useProfile();

  const [composerOpen, setComposerOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<Confession | null>(null);
  const [verdict, setVerdict] = useState<{
    rating: TeaRatingResult;
    confession: Confession;
  } | null>(null);

  const handle = profile?.anon_handle ?? 'Anonymous';

  function handleFiled(confession: Confession, rating: TeaRatingResult) {
    feed.prepend(confession);
    setComposerOpen(false);
    setVerdict({ confession, rating });
  }

  return (
    <>
      {/* ================= HERO: the masthead splash ================= */}
      <section className="relative overflow-hidden border-b-2 border-ink">
        {/* Halftone texture bleeding in from the edges */}
        <div
          aria-hidden
          className="halftone-field pointer-events-none absolute inset-0 opacity-[0.35]"
        />

        <div className="relative mx-auto max-w-broadsheet px-4 py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-end">
            <div>
              <Kicker as="p" className="text-ink">
                Vol. II · Anonymous · Unverified · Unrepentant
              </Kicker>

              {/* The scream. Condensed, tight-leading, misregistered like cheap print. */}
              <h1 className="misprint mt-4 text-balance font-display text-display-md uppercase leading-[0.85] sm:text-display-lg lg:text-display-xl">
                Everyone
                <br />
                Has A<br />
                <span className="marker-text">Receipt</span>
              </h1>

              <p className="mt-6 max-w-column font-body text-lg leading-relaxed text-ink-soft">
                File your worst decision anonymously. A savage AI editor reads it, stamps it
                between 0 and 100&deg;F, and files a verdict you did not ask for. Then the readers
                get their turn.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button size="lg" variant="marker" onClick={() => setComposerOpen(true)}>
                  <PenLine aria-hidden className="size-4" />
                  File a Spill
                </Button>

                <Link href="/leaderboard">
                  <Button size="lg" variant="secondary">
                    Read the Hall of Shame
                  </Button>
                </Link>
              </div>
            </div>

            {/* ---- The thermal scale, as an honest explainer ---- */}
            <div className="paper-block p-5">
              <Kicker as="p" className="text-ink">
                The temperature scale
              </Kicker>
              <div className="rule-double my-3" />

              <ul className="flex flex-col">
                {TIERS.map((tier, i) => (
                  <li
                    key={tier.key}
                    data-tier={tier.key}
                    className={
                      i > 0
                        ? 'flex items-center gap-3 border-t border-ink/15 py-2'
                        : 'flex items-center gap-3 py-2'
                    }
                  >
                    <span
                      aria-hidden
                      className="tier-bg size-3.5 shrink-0 border-2 border-ink"
                    />
                    <span className="w-16 shrink-0 font-mono text-micro font-bold text-ink-muted">
                      {tier.min}–{tier.max}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-display text-lg uppercase leading-none">
                      {tier.name}
                    </span>
                    <span aria-hidden className="shrink-0 text-base">
                      {tier.emoji}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="kicker mt-3 text-ink-faint">
                The editor is stingy. Most spills are not nuclear.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEED ================= */}
      <div className="mx-auto flex w-full max-w-broadsheet flex-col gap-8 px-4 py-10 lg:flex-row">
        <div className="min-w-0 flex-1">
          <FeedContainer
            confessions={feed.confessions}
            activeTab={feed.tab}
            onTabChange={feed.setTab}
            selectedCategory={feed.category}
            onCategoryChange={feed.setCategory}
            onReact={feed.react}
            onVote={feed.vote}
            onShare={setShareTarget}
            loading={feed.loading}
            error={feed.error}
            onRetry={feed.reload}
          />
        </div>

        <Sidebar
          topConfessions={feed.confessions}
          selectedCategory={feed.category}
          onSelectCategory={feed.setCategory}
        />
      </div>

      {/* ================= Overlays ================= */}
      <SpillComposer
        open={composerOpen}
        userHandle={handle}
        onClose={() => setComposerOpen(false)}
        onSuccess={handleFiled}
      />

      {verdict && (
        <VerdictReveal
          open
          rating={verdict.rating}
          confession={verdict.confession}
          onClose={() => setVerdict(null)}
          onShare={setShareTarget}
        />
      )}

      <ShareCard
        confession={shareTarget}
        onClose={() => setShareTarget(null)}
        isPremium={profile?.is_premium}
      />
    </>
  );
}
