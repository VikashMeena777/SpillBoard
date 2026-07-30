'use client';

import { useCallback, useRef, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import type { Confession } from '@/types';
import { getCategory, getTier, SITE } from '@/lib/constants';
import { compactNumber } from '@/lib/utils/format';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Kicker } from '@/components/ui/Primitives';

export interface ShareCardProps {
  confession: Confession | null;
  onClose: () => void;
  /** Premium removes the watermark, as the pricing page promises. */
  isPremium?: boolean;
}

/**
 * Exportable share card.
 *
 * Notable fixes:
 *  - `navigator.clipboard.writeText` was called unawaited and uncaught, so the
 *    "Copied!" toast fired even when the write failed or the origin was insecure.
 *    It now awaits, catches, and falls back to a manual selection path.
 *  - The watermark was stamped unconditionally while the pricing page sold
 *    watermark-free exports.
 */
export function ShareCard({ confession, onClose, isPremium = false }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = confession
    ? `${typeof window !== 'undefined' ? window.location.origin : SITE.url}/confession/${confession.id}`
    : '';

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || !confession) return;

    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        /* html-to-image renders onto a transparent canvas by default; without an
         * explicit background the exported PNG loses the paper stock. */
        backgroundColor: '#F0EDE4',
      });

      const link = document.createElement('a');
      link.download = `spillboard-${confession.tea_score}F-${confession.id.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();

      toast.success('Card saved.');
    } catch (err) {
      console.error('[ShareCard] PNG export failed:', err);
      toast.error('Could not render the card. Try again.');
    } finally {
      setDownloading(false);
    }
  }, [confession]);

  const handleCopy = useCallback(async () => {
    try {
      /* clipboard is undefined on insecure origins; check before calling. */
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');

      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy. Select the link and copy it manually.');
    }
  }, [shareUrl]);

  if (!confession) return null;

  const tier = getTier(confession.tea_score);
  const category = getCategory(confession.category);

  return (
    <Dialog
      open={Boolean(confession)}
      onClose={onClose}
      title="Print Edition"
      description="Save it as a PNG for stories, posts, or the group chat."
      size="md"
      footer={
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="marker"
            onClick={handleDownload}
            loading={downloading}
            loadingText="Rendering…"
          >
            <Download aria-hidden className="size-4" />
            Download PNG
          </Button>

          <Button variant="secondary" onClick={handleCopy}>
            {copied ? (
              <Check aria-hidden className="size-4 text-success" />
            ) : (
              <Copy aria-hidden className="size-4" />
            )}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>
      }
    >
      {/* ---- The exported artefact ---- */}
      <div
        ref={cardRef}
        data-tier={tier.key}
        /* Inline colours: html-to-image inlines computed styles, and CSS
         * variables on ancestors do not always resolve during serialisation. */
        style={{ backgroundColor: '#FAF8F2', color: '#121110' }}
        className="border-2 border-ink p-6"
      >
        {/* Masthead */}
        <div className="flex items-baseline justify-between gap-3 border-b-2 border-ink pb-2">
          <p className="font-display text-2xl leading-none">{SITE.name}</p>
          <p className="kicker" style={{ color: '#5C5852' }}>
            {category.emoji} {category.label}
          </p>
        </div>

        {/* Score band */}
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="kicker" style={{ color: '#5C5852' }}>
              Filed by
            </p>
            <p className="truncate font-mono text-sm font-bold">
              @{confession.anon_handle_snapshot}
            </p>
          </div>

          <div
            className="ink-stamp flex size-20 shrink-0 flex-col items-center justify-center leading-none"
            style={{ color: tier.hex, borderColor: tier.hex }}
          >
            <span className="text-3xl">{confession.tea_score}</span>
            <span className="mt-0.5 font-mono text-[0.5rem] font-bold tracking-widest">°F</span>
          </div>
        </div>

        {/* Headline */}
        {confession.title && (
          <h3 className="mt-4 font-display text-3xl uppercase leading-[0.9]">
            {confession.title}
          </h3>
        )}

        {/* Body, clamped so a long spill cannot blow out the card */}
        <p className="mt-3 whitespace-pre-line font-body text-[0.95rem] leading-relaxed">
          &ldquo;
          {confession.body.length > 420
            ? `${confession.body.slice(0, 417).trimEnd()}…`
            : confession.body}
          &rdquo;
        </p>

        {/* Verdict */}
        <div
          className="mt-4 border border-dashed p-3"
          style={{ borderColor: 'rgba(18,17,16,0.45)' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="kicker">Editor&apos;s verdict</p>
            <p className="kicker" style={{ color: tier.hex }}>
              {tier.emoji} {tier.name}
            </p>
          </div>
          <p className="mt-1.5 font-body text-sm italic leading-snug">
            &ldquo;{confession.ai_verdict}&rdquo;
          </p>
        </div>

        {/* Stats + attribution */}
        <div
          className="mt-4 flex items-center justify-between border-t pt-2"
          style={{ borderColor: 'rgba(18,17,16,0.2)' }}
        >
          <p className="kicker" style={{ color: '#5C5852' }}>
            🍵 {compactNumber(confession.upvotes)} · 💬{' '}
            {compactNumber(confession.comment_count)}
          </p>

          {/* Free tier keeps the watermark; premium does not. */}
          {isPremium ? (
            <p className="kicker" style={{ color: '#5C5852' }}>
              100% anonymous
            </p>
          ) : (
            <p className="kicker" style={{ color: '#5C5852' }}>
              {SITE.domain}
            </p>
          )}
        </div>
      </div>

      {!isPremium && (
        <Kicker as="p" className="mt-3 text-center text-ink-faint">
          Press Pass removes the watermark.
        </Kicker>
      )}
    </Dialog>
  );
}
