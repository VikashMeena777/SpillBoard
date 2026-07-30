'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'marker';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Renders the loading spinner and disables input without shifting width. */
  loadingText?: string;
}

const base =
  'relative inline-flex select-none items-center justify-center gap-2 border-2 border-ink font-ui font-bold uppercase tracking-wide ' +
  'transition-[transform,box-shadow,background-color] duration-150 ease-thud ' +
  'disabled:pointer-events-none disabled:opacity-45';

/* Hard offset shadow that collapses on press — the "printed block" affordance. */
const press =
  'shadow-stamp hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-stamp-lg active:translate-x-px active:translate-y-px active:shadow-press';

const variants: Record<Variant, string> = {
  primary: cn('bg-ink text-paper', press),
  marker: cn('bg-marker text-marker-ink hover:bg-marker-deep', press),
  secondary: cn('bg-paper-raised text-ink hover:bg-paper-edge', press),
  danger: cn('bg-danger text-white hover:brightness-110', press),
  ghost: 'border-transparent bg-transparent text-ink-soft hover:bg-ink/10 hover:text-ink',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

/**
 * The old build had no button primitive — every CTA hand-rolled its own
 * gradient, radius and hover, and none had a loading or disabled state.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, loadingText, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      /* Screen readers need to know the control is busy, not just visually spinning. */
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 aria-hidden className="size-4 animate-spin" />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});
