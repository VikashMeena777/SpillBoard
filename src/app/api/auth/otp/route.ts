import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

/**
 * POST /api/auth/otp
 *
 * Sends a one-time login link.
 *
 * Replaces the previous /login page, which collected an email *and a password*
 * into a handler that made no auth call at all — it toasted "Logged in
 * anonymously" and pushed to `/`. Collecting credentials that go nowhere is
 * actively unsafe, so there is no password anywhere in this flow: an email OTP
 * is enough to claim a profile, and the app stays usable with no account.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: 'Accounts are not enabled on this deployment.',
        code: 'NOT_CONFIGURED',
      },
      { status: 501 },
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
  }

  const { email } = (payload ?? {}) as Record<string, unknown>;

  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? '';

      const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${origin}/profile` },
    });


    if (error) {
      console.error('[POST /api/auth/otp]', error.message);
      /* Deliberately generic: a distinct "no such user" response would let
       * anyone enumerate which emails have claimed a profile. */
      return NextResponse.json(
        { error: 'Could not send the link. Try again shortly.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error('[POST /api/auth/otp]', err);
    return NextResponse.json({ error: 'Could not send the link.' }, { status: 500 });
  }
}
