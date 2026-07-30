import { cn } from '@/lib/utils/cn';
import { getTier } from '@/lib/constants';

/* ------------------------------------------------------------------ */
/* Kicker — mono caps label used for all metadata                      */
/* ------------------------------------------------------------------ */

export function Kicker({
  children,
  className,
  as: Tag = 'span',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'span' | 'p' | 'div' | 'h2';
}) {
  return <Tag className={cn('kicker text-ink-muted', className)}>{children}</Tag>;
}

/* ------------------------------------------------------------------ */
/* Badge — hard-edged printed chip                                     */
/* ------------------------------------------------------------------ */

export function Badge({
  children,
  className,
  variant = 'outline',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'outline' | 'solid' | 'marker' | 'tier';
}) {
  const variants = {
    outline: 'border-ink/40 bg-transparent text-ink-soft',
    solid: 'border-ink bg-ink text-paper',
    marker: 'border-ink bg-marker text-marker-ink',
    /* Consumes --tier from a data-tier ancestor. */
    tier: 'tier-border tier-text tier-wash',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-micro font-bold uppercase',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* ScoreStamp — the rotated ink stamp carrying the tea temperature     */
/* ------------------------------------------------------------------ */

export function ScoreStamp({
  score,
  size = 'md',
  animate,
  className,
}: {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}) {
  const tier = getTier(score);

  const sizes = {
    sm: 'size-12 text-lg',
    md: 'size-16 text-2xl',
    lg: 'size-24 text-4xl',
  };

  return (
    <div
      data-tier={tier.key}
      className={cn(
        'ink-stamp tier-text tier-border flex shrink-0 flex-col items-center justify-center leading-none',
        sizes[size],
        animate && 'animate-stamp-in',
        className,
      )}
      /* One accessible string instead of the old bare number. */
      role="img"
      aria-label={`Tea temperature ${score} degrees, ${tier.name}`}
    >
      <span aria-hidden>{score}</span>
      <span aria-hidden className="mt-0.5 font-mono text-[0.5em] font-bold tracking-widest">
        °F
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton — loading placeholder                                      */
/* ------------------------------------------------------------------ */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse-rule bg-ink/12', className)} />;
}

/** Feed-shaped placeholder. The old build showed three unstyled pulse blocks. */
export function ConfessionSkeleton() {
  return (
    <div className="paper-block tier-spine border-l-ink/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="size-16 shrink-0" />
      </div>
      <div className="mt-5 flex gap-2 border-t border-ink/15 pt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-14" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SectionHeading — masthead-style section divider                     */
/* ------------------------------------------------------------------ */

export function SectionHeading({
  children,
  kicker,
  action,
  className,
}: {
  children: React.ReactNode;
  kicker?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-5', className)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          {kicker && <Kicker className="mb-1.5 block">{kicker}</Kicker>}
          <h2 className="font-display text-3xl leading-none sm:text-4xl">{children}</h2>
        </div>
        {action}
      </div>
      <div className="rule-double mt-3" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* EmptyState                                                          */
/* ------------------------------------------------------------------ */

export function EmptyState({
  emoji = '🫗',
  title,
  children,
  action,
}: {
  emoji?: string;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="paper-block halftone-field flex flex-col items-center px-6 py-16 text-center">
      <span aria-hidden className="text-5xl">
        {emoji}
      </span>
      <h3 className="mt-4 font-display text-3xl">{title}</h3>
      {children && <p className="mt-2 max-w-sm text-ink-muted">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
