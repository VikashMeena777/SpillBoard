'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MailCheck, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { generateAnonHandle } from '@/lib/utils/anon-handles';
import { Button } from '@/components/ui/Button';
import { Kicker } from '@/components/ui/Primitives';

/**
 * Optional identity claim.
 *
 * The previous version collected an email AND a password, then called no auth
 * API whatsoever — it toasted "Logged in anonymously" and redirected. That is
 * worse than having no login: it harvests a password into a dead handler.
 *
 * SpillBoard is anonymous by design, so there is no password here at all. An
 * email link is the only mechanism, it is entirely optional, and the page says
 * plainly when accounts are not enabled on the deployment.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [handle, setHandle] = useState('');

  /* Generated after mount: doing it during render would mismatch on hydration. */
  useEffect(() => setHandle(generateAnonHandle()), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const payload = await response.json().catch(() => null);

      if (response.status === 501) {
        setUnavailable(true);
        return;
      }

      if (!response.ok) {
        toast.error(payload?.error ?? 'Could not send the link.');
        return;
      }

      setSent(true);
    } catch {
      toast.error('Network error. Check your connection.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16">
      <div className="paper-block p-6 sm:p-8">
        <Kicker as="p">Optional</Kicker>
        <h1 className="mt-2 font-display text-display-sm uppercase leading-[0.88]">
          Claim a Byline
        </h1>

        <p className="mt-4 font-body text-ink-soft">
          You do not need an account. Reading and filing already work anonymously. An email only
          lets you keep your karma, streak, and byline across devices.
        </p>

        <div className="mt-5 border-2 border-dashed border-ink/30 px-4 py-3">
          <Kicker as="p" className="text-ink-faint">
            Filing right now as
          </Kicker>
          <p className="mt-1 font-mono text-sm font-bold">
            @{handle || '\u2014'}
          </p>
        </div>

        {unavailable ? (
          <div role="alert" className="mt-6 border-2 border-ink bg-paper-sunk px-4 py-4">
            <p className="font-display text-2xl uppercase leading-none">Accounts are off</p>
            <p className="mt-2 font-body text-sm text-ink-soft">
              This deployment has no auth provider configured. Everything still works
              anonymously.
            </p>
            <Link href="/" className="mt-4 inline-block">
              <Button variant="primary">Back to the front page</Button>
            </Link>
          </div>
        ) : sent ? (
          <div role="status" className="mt-6 border-2 border-ink bg-paper-sunk px-4 py-4">
            <MailCheck aria-hidden className="size-6" />
            <p className="mt-2 font-display text-2xl uppercase leading-none">Check your inbox</p>
            <p className="mt-2 font-body text-sm text-ink-soft">
              We sent a sign-in link to <span className="font-mono font-bold">{email}</span>. It
              expires shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6">
            {/* Properly associated label — none of the old inputs had one. */}
            <label htmlFor="login-email" className="kicker mb-1.5 block text-ink">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-describedby="login-email-help"
              className="w-full border-2 border-ink bg-paper-raised px-3 py-2.5 font-body text-base text-ink placeholder:text-ink-faint"
            />
            <p id="login-email-help" className="kicker mt-1.5 text-ink-faint">
              Never shown on any filing. No password, ever.
            </p>

            <Button
              type="submit"
              variant="marker"
              size="lg"
              className="mt-5 w-full"
              loading={sending}
              loadingText="Sending…"
            >
              Send sign-in link
              <ArrowRight aria-hidden className="size-4" />
            </Button>
          </form>
        )}

        <p className="mt-6 flex items-center justify-center gap-1.5 border-t-2 border-ink/15 pt-4 font-mono text-micro font-bold uppercase text-ink-muted">
          <ShieldCheck aria-hidden className="size-3.5 text-success" />
          Your email is never linked to your filings
        </p>
      </div>
    </div>
  );
}
