'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, PenLine, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { SITE } from '@/lib/constants';
import { editionNumber, formatEditionDate } from '@/lib/utils/format';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const NAV_LINKS = [
  { href: '/', label: 'Front Page' },
  { href: '/leaderboard', label: 'Hall of Shame' },
  { href: '/profile', label: 'My Desk' },
  { href: '/pricing', label: 'Press Pass' },
] as const;

/**
 * Masthead.
 *
 * Rebuilt from the old sticky navbar, which had no mobile menu at all (`hidden
 * md:flex` and nothing else), a marquee of three hardcoded fake confessions, and
 * a "PRO 🍵" badge unrelated to any subscription state.
 */
export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [edition, setEdition] = useState<{ no: string; date: string } | null>(null);

  /* Dates differ between server and client render; defer to avoid a mismatch. */
  useEffect(() => {
    const now = new Date();
    setEdition({ no: editionNumber(now), date: formatEditionDate(now) });
  }, []);

  /* Close the drawer on navigation. */
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  /* Lock scroll while the drawer is open. */
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  /* Escape closes the drawer. */
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper/95 backdrop-blur-sm">
      {/* Edition strip */}
      <div className="border-b border-ink/25 bg-ink text-paper">
        <div className="mx-auto flex max-w-broadsheet items-center justify-between gap-4 px-4 py-1.5">
          <p className="kicker text-paper/80">
            No. {edition?.no ?? '————'} · Anonymous · Unverified · Unrepentant
          </p>
          <p className="kicker hidden text-paper/60 sm:block">{edition?.date ?? ''}</p>
        </div>
      </div>

      <div className="mx-auto flex max-w-broadsheet items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="group flex items-baseline gap-2"
          aria-label={`${SITE.name} home`}
        >
          <span className="relative font-display text-3xl leading-none tracking-tight sm:text-4xl">
            {SITE.name}
            {/* Steam curling off the wordmark */}
            <span
              aria-hidden
              className="absolute -right-3 -top-1 hidden text-xs opacity-0 transition-opacity group-hover:opacity-100 motion-safe:animate-steam sm:block"
            >
              ~
            </span>
          </span>
          <span className="kicker hidden text-ink-faint md:block">{SITE.tagline}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'border-2 border-transparent px-3 py-1.5 font-ui text-sm font-bold uppercase tracking-wide transition',
                  active
                    ? 'border-ink bg-marker text-marker-ink'
                    : 'text-ink-soft hover:border-ink hover:text-ink',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />

          <Link href="/spill" className="hidden sm:block">
            <Button size="sm" variant="primary">
              <PenLine aria-hidden className="size-4" />
              File a Spill
            </Button>
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="inline-flex size-9 items-center justify-center border-2 border-ink bg-paper-raised text-ink md:hidden"
          >
            {menuOpen ? (
              <X aria-hidden className="size-4" />
            ) : (
              <Menu aria-hidden className="size-4" />
            )}
          </button>
        </div>
      </div>

      <div className="rule-double" />

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        hidden={!menuOpen}
        className="border-b-2 border-ink bg-paper-raised md:hidden"
      >
        <nav aria-label="Mobile" className="flex flex-col p-3">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'border-b border-ink/15 px-2 py-3 font-display text-2xl uppercase',
                  active ? 'text-ink' : 'text-ink-soft',
                )}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="mt-4 flex items-center gap-2">
            <Link href="/spill" className="flex-1">
              <Button className="w-full" variant="primary">
                <PenLine aria-hidden className="size-4" />
                File a Spill
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
