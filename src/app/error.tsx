'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Kicker } from '@/components/ui/Primitives';

/**
 * Route-level error boundary. The old build had none, so any render-time throw
 * (an unparseable `created_at`, a missing field on a Supabase row) took out the
 * whole page with the default Next.js overlay in dev and a blank screen in prod.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[SpillBoard] unhandled render error:', error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-20">
      <div className="paper-block halftone-field p-6 text-center sm:p-8">
        <Kicker as="p">Stop the presses</Kicker>

        <h1 className="misprint mt-3 font-display text-display-sm uppercase leading-[0.86]">
          Print Failure
        </h1>

        <p className="mt-4 font-body text-ink-soft">
          Something broke on the way to the page. The filing itself is fine.
        </p>

        {error.digest && (
          <p className="kicker mt-3 text-ink-faint">Reference: {error.digest}</p>
        )}

        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Button variant="marker" onClick={reset}>
            Try again
          </Button>
          <Link href="/">
            <Button variant="secondary">Front page</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
