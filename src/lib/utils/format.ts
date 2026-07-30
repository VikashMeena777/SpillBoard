import { formatDistanceToNowStrict } from 'date-fns';

/**
 * Relative timestamp, in newsroom shorthand ("4h ago", "3d ago").
 *
 * Guards against invalid dates: the old cards passed `created_at` straight into
 * date-fns, which throws on an unparseable string and would take down the whole
 * feed render.
 */
export function timeAgo(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'just now';

  try {
    return `${formatDistanceToNowStrict(date, { addSuffix: false })
      .replace(' seconds', 's')
      .replace(' second', 's')
      .replace(' minutes', 'm')
      .replace(' minute', 'm')
      .replace(' hours', 'h')
      .replace(' hour', 'h')
      .replace(' days', 'd')
      .replace(' day', 'd')
      .replace(' months', 'mo')
      .replace(' month', 'mo')
      .replace(' years', 'y')
      .replace(' year', 'y')} ago`;
  } catch {
    return 'just now';
  }
}

/** Absolute timestamp for the <time> element's machine-readable title. */
export function fullDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** Compact counts so a four-digit number cannot break a pill's layout. */
export function compactNumber(value: number): string {
  const n = Number(value) || 0;
  if (Math.abs(n) < 1000) return String(n);
  if (Math.abs(n) < 1_000_000) {
    const k = n / 1000;
    return `${k % 1 === 0 ? k : k.toFixed(1)}k`;
  }
  const m = n / 1_000_000;
  return `${m % 1 === 0 ? m : m.toFixed(1)}M`;
}

/** Edition number, for masthead flavour. Deterministic per day. */
export function editionNumber(date: Date = new Date()): string {
  const start = Date.UTC(2024, 0, 1);
  const days = Math.floor((date.getTime() - start) / 86_400_000);
  return String(Math.max(1, days)).padStart(4, '0');
}

export function formatEditionDate(date: Date = new Date()): string {
  return date
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase();
}
