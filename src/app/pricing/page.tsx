'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, CreditCard, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { LIMITS, PLAN } from '@/lib/constants';
import { MAX_REROLLS_PER_DAY } from '@/lib/utils/anon-handles';
import { useProfile } from '@/lib/hooks/useProfile';
import { Button } from '@/components/ui/Button';
import { Kicker } from '@/components/ui/Primitives';

/**
 * Press Pass / subscription terms.
 *
 * The old page called a 1800ms setTimeout and then toasted "Premium features
 * unlocked!" without any payment, order, or state change — it told the user they
 * had bought something they had not. This calls the real checkout route and
 * reports honestly when payments are not configured on the deployment.
 */

interface Feature {
  label: string;
  free: string | false;
  pro: string | true;
}

const FEATURES: readonly Feature[] = [
  {
    label: 'Filings per day',
    free: `${LIMITS.freeSpillsPerDay}`,
    pro: 'Unlimited',
  },
  { label: 'AI editor verdict', free: 'Standard', pro: 'Unfiltered' },
  {
    label: 'Byline changes per day',
    free: `${MAX_REROLLS_PER_DAY}`,
    pro: 'Unlimited',
  },
  { label: 'Watermark-free card exports', free: false, pro: true },
  { label: 'Ad-free reading', free: false, pro: true },
  { label: 'Local Edition filters', free: 'Basic', pro: 'All cities' },
] as const;

export default function PricingPage() {
  const { profile } = useProfile();
  const [processing, setProcessing] = useState(false);

  const isPremium = Boolean(profile?.is_premium);

  async function handleSubscribe() {
    setProcessing(true);

    try {
      const response = await fetch('/api/checkout', { method: 'POST' });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        /* 501 means the deployment has no payment credentials. Say exactly that
         * rather than showing a generic failure or a fake success. */
        toast.error(payload?.error ?? 'Could not start checkout.');
        return;
      }

      if (!payload?.paymentSessionId) {
        toast.error('The payment provider did not return a session.');
        return;
      }

      /*
       * Handing off to Cashfree requires their JS SDK, which is not a dependency
       * of this project. Rather than pretend the redirect happened, surface the
       * session so the integration step is explicit.
       */
      toast.success('Checkout session created. Complete payment to activate.');
      console.info('[pricing] payment session:', payload.paymentSessionId);
    } catch {
      toast.error('Network error starting checkout.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-broadsheet px-4 py-12">
      {/* ---- Masthead ---- */}
      <header className="border-b-2 border-ink pb-8 text-center">
        <Kicker as="p">Subscriptions desk</Kicker>
        <h1 className="misprint mt-3 font-display text-display-sm uppercase leading-[0.86] sm:text-display-md">
          Get a Press Pass
        </h1>
        <p className="mx-auto mt-4 max-w-column font-body text-lg text-ink-soft">
          Everything on SpillBoard works for free. A Press Pass lifts the limits and takes the
          watermark off your cards.
        </p>
      </header>

      {/* ---- Plans ---- */}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* Free */}
        <section aria-labelledby="plan-free" className="paper-block flex flex-col p-6 sm:p-8">
          <Kicker as="p">Free forever</Kicker>
          <h2 id="plan-free" className="mt-2 font-display text-5xl leading-none">
            &#8377;0
          </h2>
          <p className="mt-3 font-body text-ink-soft">
            For readers and occasional filers. No account required.
          </p>

          <ul className="mt-6 flex-1 space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature.label} className="flex items-start gap-2.5">
                {feature.free === false ? (
                  <Minus aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-faint" />
                ) : (
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                )}
                <span
                  className={cn(
                    'font-body text-sm',
                    feature.free === false ? 'text-ink-faint' : 'text-ink-soft',
                  )}
                >
                  {feature.label}
                  {typeof feature.free === 'string' && (
                    <span className="font-mono text-xs font-bold"> · {feature.free}</span>
                  )}
                  <span className="sr-only">
                    {feature.free === false ? ' (not included)' : ' (included)'}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <Button variant="secondary" disabled className="mt-8 w-full">
            {isPremium ? 'Downgraded plan' : 'Your current plan'}
          </Button>
        </section>

        {/* Pro */}
        <section
          aria-labelledby="plan-pro"
          className="paper-block relative flex flex-col border-3 p-6 shadow-stamp-lg sm:p-8"
        >
          <span className="absolute -right-2 -top-3 border-2 border-ink bg-marker px-2.5 py-1 font-mono text-micro font-bold uppercase text-marker-ink">
            Most filed
          </span>

          <Kicker as="p">Press Pass</Kicker>
          <h2 id="plan-pro" className="mt-2 font-display text-5xl leading-none">
            {/* Driven by PLAN so the displayed price cannot drift from the
                amount /api/checkout actually charges. */}
            {PLAN.amountDisplay}
            <span className="ml-1 font-mono text-sm font-bold text-ink-muted">/ month</span>
          </h2>
          <p className="kicker mt-1.5 text-ink-faint">
            Roughly {PLAN.amountUsdDisplay} outside India
          </p>

          <p className="mt-3 font-body text-ink-soft">
            For people who file often and post the cards.
          </p>

          <ul className="mt-6 flex-1 space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature.label} className="flex items-start gap-2.5">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                <span className="font-body text-sm text-ink">
                  {feature.label}
                  {typeof feature.pro === 'string' && (
                    <span className="font-mono text-xs font-bold"> · {feature.pro}</span>
                  )}
                  <span className="sr-only"> (included)</span>
                </span>
              </li>
            ))}
          </ul>

          {isPremium ? (
            <Button variant="secondary" disabled className="mt-8 w-full">
              Active
            </Button>
          ) : (
            <Button
              variant="marker"
              size="lg"
              className="mt-8 w-full"
              onClick={handleSubscribe}
              loading={processing}
              loadingText="Opening checkout…"
            >
              <CreditCard aria-hidden className="size-4" />
              Subscribe
            </Button>
          )}

          <p className="kicker mt-3 text-center text-ink-faint">
            UPI, cards, and netbanking via Cashfree. Cancel any time.
          </p>
        </section>
      </div>

      {/* ---- Honest note ---- */}
      <p className="mx-auto mt-10 max-w-column border-2 border-dashed border-ink/30 px-4 py-3 text-center font-body text-sm text-ink-muted">
        Anonymity is unaffected by subscribing. Payment details go to Cashfree and are never
        linked to your filings.{' '}
        <Link href="/" className="underline underline-offset-2 hover:text-ink">
          Back to the front page
        </Link>
        .
      </p>
    </div>
  );
}
