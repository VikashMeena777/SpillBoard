import Link from 'next/link';
import { SITE } from '@/lib/constants';
import { editionNumber } from '@/lib/utils/format';

const FOOTER_LINKS = [
  { label: 'Front Page', href: '/' },
  { label: 'Hall of Shame', href: '/leaderboard' },
  { label: 'My Desk', href: '/profile' },
  { label: 'Press Pass', href: '/pricing' },
] as const;

export function Footer() {
  const edition = editionNumber();

  return (
    <footer className="border-t-2 border-ink bg-paper-sunk">
      <div className="rule-double" />
      <div className="mx-auto max-w-broadsheet px-4 py-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Masthead */}
          <div>
            <p className="font-display text-4xl leading-none">{SITE.name}</p>
            <p className="kicker mt-2 text-ink-muted">{SITE.tagline}</p>
            <p className="kicker mt-3 text-ink-faint">
              Est. 2024 · No. {edition} · All confessions anonymous
            </p>
          </div>

          {/* Nav */}
          <nav aria-label="Footer">
            <p className="kicker mb-3 text-ink-muted">Sections</p>
            <ul className="space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-ui text-sm font-bold uppercase text-ink-soft underline-offset-2 hover:text-ink hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Policy */}
          <div>
            <p className="kicker mb-3 text-ink-muted">Policy</p>
            <p className="font-body text-sm leading-relaxed text-ink-muted">
              All confessions are anonymous. No names, no traces, no mercy. Content is moderated
              for safety. The AI verdict is satire, not journalism.
            </p>
            <p className="kicker mt-4 text-ink-faint">
              © {new Date().getFullYear()} {SITE.name}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
