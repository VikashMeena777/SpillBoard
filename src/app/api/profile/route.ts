import { NextResponse } from 'next/server';
import { getProfile, updateProfile } from '@/lib/store/server-store';
import { attachAnonIdentity, getAnonIdentity, rerollAnonHandle } from '@/lib/auth/anon-session';
import { MAX_REROLLS_PER_DAY } from '@/lib/utils/anon-handles';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profile — the viewer's own anonymous profile.
 */
export async function GET() {
  const identity = getAnonIdentity();
  const profile = getProfile(identity.id, identity.handle);
  const response = NextResponse.json({ profile }, { status: 200 });
  return attachAnonIdentity(response, identity);
}

/**
 * POST /api/profile/reroll — issue a new byline.
 *
 * The reroll cap was declared on the Profile type (`handle_rerolls_today`) but
 * never enforced: the profile page rerolled locally with no server involvement
 * and no ceiling.
 */
export async function POST() {
  const identity = getAnonIdentity();
  const profile = getProfile(identity.id, identity.handle);

  if (profile.handle_rerolls_today >= MAX_REROLLS_PER_DAY) {
    return NextResponse.json(
      {
        error: `You have used all ${MAX_REROLLS_PER_DAY} byline changes today.`,
        code: 'REROLL_LIMIT',
      },
      { status: 429 },
    );
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });
  const handle = rerollAnonHandle(response);

  const updated = updateProfile(identity.id, {
    anon_handle: handle,
    handle_rerolls_today: profile.handle_rerolls_today + 1,
  });

  return NextResponse.json(
    { profile: updated ?? { ...profile, anon_handle: handle } },
    { status: 200, headers: response.headers },
  );
}
