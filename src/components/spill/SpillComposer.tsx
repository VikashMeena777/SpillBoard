'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, MapPin, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import type { Category, Confession, TeaRatingResult } from '@/types';
import { cn } from '@/lib/utils/cn';
import { CATEGORIES, CATEGORY_MAP, LIMITS } from '@/lib/constants';
import { ApiError, submitConfession } from '@/lib/api/client';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Kicker } from '@/components/ui/Primitives';

export interface SpillComposerProps {
  open: boolean;
  userHandle: string;
  onClose: () => void;
  onSuccess: (confession: Confession, rating: TeaRatingResult) => void;
}

/**
 * The filing desk: compose and submit a spill.
 *
 * Submission now goes through POST /api/spill instead of calling
 * `rateConfessionWithAI` in the browser, where the API keys do not exist. That
 * single change is what makes the LLM rating actually run.
 */
export function SpillComposer({ open, userHandle, onClose, onSuccess }: SpillComposerProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<Category>('relationship');
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const formRef = useRef<HTMLFormElement>(null);

  /* Reset between openings so a previous draft or error never leaks back in. */
  useEffect(() => {
    if (!open) return;
    setError('');
    setSubmitting(false);
  }, [open]);

  const remaining = LIMITS.bodyMax - body.length;
  const tooShort = body.trim().length < LIMITS.bodyMin;
  const tooLong = body.length > LIMITS.bodyMax;
  const canSubmit = !tooShort && !tooLong && !submitting;

  const placeholder = useMemo(() => CATEGORY_MAP[category]?.prompt ?? '', [category]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError('');

    try {
      const result = await submitConfession({
        body,
        category,
        title: title.trim() || undefined,
        city: city.trim() || undefined,
      });

      toast.success('Filed. The editor has ruled.');
      setTitle('');
      setBody('');
      setCity('');
      onSuccess(result.confession, result.rating);
    } catch (err) {
      /* Typed errors instead of `err: any` — the daily cap needs distinct copy. */
      const message =
        err instanceof ApiError
          ? err.message
          : 'Could not file that spill. Try again in a moment.';

      setError(message);

      if (err instanceof ApiError && err.code === 'DAILY_LIMIT') {
        toast.error('Daily filing limit reached.');
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="File a Spill"
      description={`Filing anonymously as @${userHandle}`}
      size="lg"
      /* Do not let a stray Escape discard a half-written confession mid-submit. */
      dismissable={!submitting}
      footer={
        <div className="flex items-center justify-between gap-3">
          <Kicker className="hidden sm:block">Anonymous · Unverified · Permanent</Kicker>
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="marker"
              disabled={!canSubmit}
              loading={submitting}
              loadingText="Editor reading…"
              /* The button sits in the footer, outside <form>; this links them. */
              onClick={() => formRef.current?.requestSubmit()}
            >
              <PenLine aria-hidden className="size-4" />
              Send to the editor
            </Button>
          </div>
        </div>
      }
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {/* ---- Desk ---- */}
        <fieldset>
          <legend className="kicker mb-2 text-ink">Which desk?</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CATEGORIES.map((cat) => {
              const active = category === cat.key;
              return (
                <label
                  key={cat.key}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 border-2 px-2.5 py-2 font-mono text-xs font-bold transition',
                    /* focus-within surfaces the ring for the visually hidden radio. */
                    'focus-within:outline focus-within:outline-3 focus-within:outline-offset-2',
                    active
                      ? 'border-ink bg-marker text-marker-ink'
                      : 'border-ink/25 bg-paper-sunk text-ink-soft hover:border-ink',
                  )}
                >
                  {/* A real radio group: keyboard arrows work and it is announced. */}
                  <input
                    type="radio"
                    name="desk"
                    value={cat.key}
                    checked={active}
                    onChange={() => setCategory(cat.key)}
                    className="sr-only"
                  />
                  <span aria-hidden>{cat.emoji}</span>
                  <span className="truncate">{cat.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* ---- Headline ---- */}
        <div>
          {/* htmlFor/id pairs: none of the old labels were associated with inputs. */}
          <label htmlFor="spill-title" className="kicker mb-1.5 block text-ink">
            Headline <span className="text-ink-faint">(optional)</span>
          </label>
          <input
            id="spill-title"
            type="text"
            maxLength={LIMITS.titleMax}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give it a headline worth printing"
            className="w-full border-2 border-ink bg-paper-raised px-3 py-2.5 font-display text-xl uppercase text-ink placeholder:font-body placeholder:text-base placeholder:normal-case placeholder:text-ink-faint"
          />
        </div>

        {/* ---- Body ---- */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <label htmlFor="spill-body" className="kicker text-ink">
              The spill <span className="text-danger">*</span>
            </label>
            <span
              /* Announce the count politely rather than on every keystroke. */
              aria-live="polite"
              className={cn(
                'font-mono text-micro font-bold',
                tooLong ? 'text-danger' : remaining <= 60 ? 'text-ink' : 'text-ink-faint',
              )}
            >
              {body.length}/{LIMITS.bodyMax}
            </span>
          </div>

          <textarea
            id="spill-body"
            required
            rows={7}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            /* No maxLength attribute: silently truncating typed text is worse
             * than showing the count going red. The old form allowed 1000 here
             * while the server rejected above 600. */
            aria-describedby="spill-body-help"
            aria-invalid={tooLong || undefined}
            placeholder={placeholder}
            className="w-full resize-y border-2 border-ink bg-paper-raised px-3 py-3 font-body text-base leading-relaxed text-ink placeholder:text-ink-faint"
          />

          <p id="spill-body-help" className="kicker mt-1.5 text-ink-faint">
            {LIMITS.bodyMin}–{LIMITS.bodyMax} characters. No names, numbers, emails, or links —
            they are rejected automatically.
          </p>
        </div>

        {/* ---- City ---- */}
        <div>
          <label htmlFor="spill-city" className="kicker mb-1.5 block text-ink">
            City <span className="text-ink-faint">(optional)</span>
          </label>
          <div className="relative">
            <MapPin
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
            />
            <input
              id="spill-city"
              type="text"
              maxLength={LIMITS.cityMax}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Mumbai, Berlin, Lagos…"
              aria-describedby="spill-city-help"
              className="w-full border-2 border-ink bg-paper-raised py-2.5 pl-9 pr-3 font-body text-base text-ink placeholder:text-ink-faint"
            />
          </div>
          <p id="spill-city-help" className="kicker mt-1.5 text-ink-faint">
            Adding a city puts your spill in the Local Edition.
          </p>
        </div>

        {/* ---- Error ---- */}
        {error && (
          /* role="alert" so a rejection is announced immediately. */
          <div
            role="alert"
            className="flex items-start gap-2 border-2 border-danger bg-danger/10 px-3 py-2.5"
          >
            <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />
            <p className="font-mono text-xs font-bold text-danger">{error}</p>
          </div>
        )}
      </form>
    </Dialog>
  );
}
