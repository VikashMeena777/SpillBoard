'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Paper edition / night edition switch.
 *
 * The old build hardcoded `class="dark"` on <html> with next-themes installed but
 * unused, so there was no way to change edition.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  /* Theme is unknown until after hydration; render a stable placeholder so the
   * markup matches on both passes. */
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={
        mounted
          ? `Switch to ${isDark ? 'paper' : 'night'} edition`
          : 'Switch edition'
      }
      title={mounted ? `Switch to ${isDark ? 'paper' : 'night'} edition` : undefined}
      className={cn(
        'inline-flex size-9 items-center justify-center border-2 border-ink bg-paper-raised text-ink',
        'transition hover:bg-marker hover:text-marker-ink',
        className,
      )}
    >
      {mounted && isDark ? (
        <Sun aria-hidden className="size-4" />
      ) : (
        <Moon aria-hidden className="size-4" />
      )}
    </button>
  );
}
