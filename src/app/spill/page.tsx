'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PenLine } from 'lucide-react';
import type { Confession, TeaRatingResult } from '@/types';
import { CATEGORIES, LIMITS, TIERS } from '@/lib/constants';
import { useProfile } from '@/lib/hooks/useProfile';
import { SpillComposer } from '@/components/spill/SpillComposer';
import { VerdictReveal } from '@/components/spill/VerdictReveal';
import { ShareCard } from '@/components/feed/ShareCard';
import { Button } from '@/components/ui/Button';
import { Kicker } from '@/components/ui/Primitives';

/**
 * The filing desk, as a real page.
 *
 * The old /spill route rendered SpillTeaModal — a `fixed inset-0` overlay — as
 * the page body, so the route was a modal floating over nothing, with an empty
 * `onOpenSpillModal={() => {}}` handler. This is a proper landing page that
 * opens the composer.
 */
export default function SpillPage() {
  const router = useRouter();
  const { profile } = useProfile();

  const [composerOpen, setComposerOpen] = useState(true);
  const [shareTarget, setShareTarget] = useState<Confession | null>(null);
  const [verdict, setVerdict] = useState<{
    rating: TeaRatingResult;
    confession: Confession;
  } | null>(null);

  function handleFiled(confession: Confession, rating: TeaRatingResult) {
    setComposerOpen(false);
    setVerdict({ confession, rating });
  }

  return (
    <>
      <div className="mx-auto w-full max-w-broadsheet px-4 py-12">
        <header className="border-b-2 border-ink pb-8">
          <Kicker as="p">Filing desk</Kicker>
          <h1 className="misprint mt-3 text-balance font-display text-display-sm uppercase leading-[0.86] sm:text-display-md">
            Put It On<br />The Record
          </h1>
          <p className="mt-5 max-w-column font-body text-lg leading-relaxed text-ink-soft">
            No name attached, no account needed. The editor reads it, stamps a temperature between
            0 and 100&deg;F, and files a verdict. Then the readers decide.
          </p>

          <Button
            size="lg"
            variant="marker"
            className="mt-7"
            onClick={() => setComposerOpen(true)}
          >
            <PenLine aria-hidden className="size-4" />
            Open the composer
          </Button>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
          {/* ---- House rules ---- */}
          <section aria-labelledby="rules" className="paper-block p-6">
            <h2 id="rules" className="font-display text-3xl leading-none">
              House Rules
            </h2>
            <div className="rule-double my-4" />

            <ol className="space-y-4">
              {[
                {
                  title: 'No identifying details',
                  body: 'Phone numbers, emails, social handles, links, and street addresses are rejected automatically. Change names if you have to.',
                },
                {
                  title: `${LIMITS.bodyMin}–${LIMITS.bodyMax} characters`,
                  body: 'Long enough to be a story, short enough to read on a phone.',
                },
                {
                  title: 'Gossip, not harm',
                  body: 'Petty revenge and bad decisions are the point. Threats, doxxing, and content involving minors are not.',
                },
                {
                  title: 'Filings are permanent',
                  body: 'Once the editor rules, the verdict stands. Write it like it stays up.',
                },
              ].map((rule, i) => (
                <li key={rule.title} className="flex gap-3">
                  <span
                    aria-hidden
                    className="flex size-7 shrink-0 items-center justify-center border-2 border-ink font-display text-base leading-none"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-display text-lg uppercase leading-none">{rule.title}</p>
                    <p className="mt-1.5 font-body text-sm leading-relaxed text-ink-muted">
                      {rule.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <div className="flex flex-col gap-8">
            {/* ---- Desks ---- */}
            <section aria-labelledby="desks" className="paper-block p-6">
              <h2 id="desks" className="font-display text-3xl leading-none">
                Pick a Desk
              </h2>
              <div className="rule-double my-4" />

              <ul className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((category) => (
                  <li
                    key={category.key}
                    className="flex items-center gap-2 border-2 border-ink/20 bg-paper-sunk px-2.5 py-2"
                  >
                    <span aria-hidden>{category.emoji}</span>
                    <span className="truncate font-mono text-xs font-bold uppercase">
                      {category.label}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* ---- Scale ---- */}
            <section aria-labelledby="scale" className="paper-block p-6">
              <h2 id="scale" className="font-display text-3xl leading-none">
                How It Scores
              </h2>
              <div className="rule-double my-4" />

              <ul className="flex flex-col">
                {TIERS.map((tier, i) => (
                  <li
                    key={tier.key}
                    data-tier={tier.key}
                    className={
                      i > 0
                        ? 'flex items-baseline gap-3 border-t border-ink/15 py-2.5'
                        : 'flex items-baseline gap-3 pb-2.5'
                    }
                  >
                    <span className="tier-text w-16 shrink-0 font-mono text-xs font-bold">
                      {tier.min}–{tier.max}
                    </span>
                    <span className="font-display text-lg uppercase leading-none">
                      {tier.name}
                    </span>
                    <span className="ml-auto shrink-0 font-body text-xs italic text-ink-faint">
                      {tier.blurb}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>

      <SpillComposer
        open={composerOpen}
        userHandle={profile?.anon_handle ?? 'Anonymous'}
        onClose={() => setComposerOpen(false)}
        onSuccess={handleFiled}
      />

      {verdict && (
        <VerdictReveal
          open
          rating={verdict.rating}
          confession={verdict.confession}
          onClose={() => {
            setVerdict(null);
            /* Send them to the feed so the new filing is in context. */
            router.push('/');
          }}
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
