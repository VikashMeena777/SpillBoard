'use client';

import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Hide the visible title but keep it as the accessible name. */
  hideTitle?: boolean;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Set false for flows that must not be dismissed mid-way (e.g. AI reveal). */
  dismissable?: boolean;
  className?: string;
}

const SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
};

/**
 * Modal dialog with the accessibility contract the previous modals lacked
 * entirely: labelled dialog role, focus move-in, focus trap, focus restore,
 * Escape to close, backdrop click, and background scroll lock.
 *
 * AnimatePresence lives here (outside the conditional content) so exit
 * animations actually play.
 */
export function Dialog({
  open,
  onClose,
  title,
  hideTitle,
  description,
  children,
  footer,
  size = 'md',
  dismissable = true,
  className,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  const requestClose = useCallback(() => {
    if (dismissable) onClose();
  }, [dismissable, onClose]);

  /* Remember the trigger, focus the panel, restore on unmount. */
  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;

    const raf = requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(SELECTORS);
      (first ?? panelRef.current)?.focus();
    });

    return () => {
      cancelAnimationFrame(raf);
      restoreRef.current?.focus?.();
    };
  }, [open]);

  /* Escape + Tab cycling. */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        requestClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(SELECTORS);
      if (!nodes || nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const list = Array.from(nodes).filter((n) => n.offsetParent !== null || n === document.activeElement);
      if (list.length === 0) return;

      const first = list[0];
      const last = list[list.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, requestClose]);

  /* Scroll lock. Compensate for the scrollbar so the page does not jump. */
  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPad;
    };
  }, [open]);

  /* Portals require the DOM; bail during SSR. */
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={requestClose}
            className="fixed inset-0 bg-ink/70 backdrop-blur-[2px]"
            /* Decorative: the accessible close paths are the button and Escape. */
            aria-hidden
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className={cn(
              'relative z-10 my-auto w-full border-2 border-ink bg-paper shadow-stamp-lg outline-none',
              sizes[size],
              className,
            )}
          >
            <header className="flex items-start justify-between gap-4 border-b-2 border-ink bg-ink px-5 py-3 text-paper">
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className={cn(
                    'font-display text-2xl leading-none tracking-tight',
                    hideTitle && 'sr-only',
                  )}
                >
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="mt-1.5 font-mono text-micro text-paper/70">
                    {description}
                  </p>
                )}
              </div>

              {dismissable && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={`Close ${title}`}
                  className="-mr-1 -mt-0.5 shrink-0 border-2 border-transparent p-1 text-paper/70 transition hover:border-paper hover:text-paper"
                >
                  <X aria-hidden className="size-5" />
                </button>
              )}
            </header>

            <div className="max-h-[70dvh] overflow-y-auto px-5 py-5">{children}</div>

            {footer && (
              <footer className="border-t-2 border-ink bg-paper-sunk px-5 py-4">{footer}</footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
