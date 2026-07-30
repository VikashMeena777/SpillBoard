'use client';

import { useEffect, useReducer, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Confession, TeaRatingResult } from '@/types';
import { CELEBRATION_THRESHOLD, getTierByLabel, TIERS } from '@/lib/constants';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Kicker } from '@/components/ui/Primitives';

export interface VerdictRevealProps {
  open: boolean;
  rating: TeaRatingResult;
  confession: Confession;
  onClose: () => void;
  onShare: (confession: Confession) => void;
}

/**
 * The editor's ruling, revealed as a stamped verdict.
 *
 * Two fixes over the old TeaRatingModal:
 *
 *  1. It computed `increment = targetScore / steps`, so a score of 0 produced an
 *     increment of 0, `current` never reached the target, `showVerdict` never
 *     became true, and the interval spun forever until unmount.
 *  2. It animated with setInterval and no reduced-motion guard. This uses
 *     requestAnimationFrame against elapsed time (so the duration holds
 *     regardless of frame rate) and respects prefers-reduced-motion.
 */

interface State {
  score: number;
  revealed: boolean;
}

type Action = { type: 'tick'; score: number } | { type: 'done'; score: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'tick':
      return { ...state, score: action.score };
    case 'done':
      return { score: action.score, revealed: true };
  }
}

const ROLL_DURATION_MS = 1400;

export function VerdictReveal({
  open,
  rating,
  confession,
  onClose,
  onShare,
}: VerdictRevealProps) {
  const target = rating.tea_score;
  const tier = getTierByLabel(rating.temperature);
  const firedRef = useRef(false);

  const [state, dispatch] = useReducer(reducer, { score: 0, revealed: false });

  useEffect(() => {
    if (!open) return;

    firedRef.current = false;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Reduced motion, or a zero score: settle immediately. The zero case is
     * exactly what used to hang. */
    if (reduceMotion || target <= 0) {
      dispatch({ type: 'done', score: target });
      return;
    }

    let raf = 0;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / ROLL_DURATION_MS);
      /* Ease-out so the number decelerates into place. */
      const eased = 1 - Math.pow(1 - progress, 3);

      if (progress >= 1) {
        dispatch({ type: 'done', score: target });
        return;
      }

      dispatch({ type: 'tick', score: Math.round(target * eased) });
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [open, target]);

  /* Confetti, once, only for a genuinely hot score, and never under reduced motion. */
  useEffect(() => {
    if (!state.revealed || firedRef.current) return;
    firedRef.current = true;

    if (target < CELEBRATION_THRESHOLD) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    void confetti({
      particleCount: 90,
      spread: 78,
      origin: { y: 0.55 },
      colors: ['#E8FF3D', tier.hex, '#121110'],
      disableForReducedMotion: true,
    });
  }, [state.revealed, target, tier.hex]);

  return (
    <Dialog open={open} onClose={onClose} title="The Verdict" size="md">
      <div className="text-center">
        <Kicker as="p">Tea temperature</Kicker>

        {/* ---- The score, stamped ---- */}
        <div data-tier={tier.key} className="mt-3 flex flex-col items-center">
          <div
            className="tier-text font-display text-display-lg leading-none misprint"
            /* One announcement when it settles, instead of ~45 during the roll. */
            aria-live="polite"
            aria-atomic="true"
          >
            {state.score}
            <span className="align-top text-4xl">°F</span>
          </div>

          <p className="mt-1 font-display text-3xl uppercase">
            <span aria-hidden>{tier.emoji} </span>
            {tier.name}
          </p>
          <p className="kicker mt-1 text-ink-faint">{tier.blurb}</p>

          {/* ---- Thermal ramp gauge ---- */}
          <div className="mt-6 w-full">
            <div className="flex h-6 w-full border-2 border-ink">
              {TIERS.map((t) => {
                /* Each segment fills only up to where the score reaches inside it. */
                const span = t.max - t.min + 1;
                const filled = Math.max(0, Math.min(span, state.score - t.min + 1));
                const pct = (filled / span) * 100;

                return (
                  <div
                    key={t.key}
                    className="relative flex-1 border-r-2 border-ink last:border-r-0"
                    style={{ backgroundColor: 'rgb(var(--paper-sunk))' }}
                  >
                    <motion.div
                      className="absolute inset-y-0 left-0"
                      style={{ backgroundColor: t.hex }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-1 flex justify-between">
              <span className="kicker text-ink-faint">0</span>
              <span className="kicker text-ink-faint">100</span>
            </div>
          </div>
        </div>

        {/* ---- Verdict copy ---- */}
        {state.revealed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="receipt mt-7 px-4 py-4 text-left"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Kicker className="text-ink">Editor&apos;s ruling</Kicker>
              <span className="border border-ink px-2 py-0.5 font-mono text-micro font-bold uppercase">
                {rating.vibe_tag}
              </span>
            </div>

            <p className="mt-2.5 font-body text-lg italic leading-snug">
              &ldquo;{rating.verdict}&rdquo;
            </p>
          </motion.div>
        )}

        {/* ---- Actions ---- */}
        <div className="mt-7 flex flex-col gap-2">
          <Button
            variant="marker"
            size="lg"
            onClick={() => {
              onClose();
              onShare(confession);
            }}
          >
            <Share2 aria-hidden className="size-4" />
            Print a shareable card
          </Button>

          <Button variant="ghost" onClick={onClose}>
            Back to the front page
            <ArrowRight aria-hidden className="size-4" />
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
