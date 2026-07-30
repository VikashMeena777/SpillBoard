import { NextResponse } from 'next/server';
import type { ReactionType } from '@/types';
import { REACTIONS } from '@/lib/constants';
import { castVote, toggleReaction } from '@/lib/store/server-store';
import { attachAnonIdentity, getAnonIdentity } from '@/lib/auth/anon-session';
import { clientKey, rateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit';

const VALID_REACTIONS = new Set<string>(REACTIONS.map((r) => r.key));

/**
 * POST /api/confessions/[id]/interact
 *
 * Single endpoint for reactions and votes. Both were previously fire-and-forget
 * writes from the browser with empty catch blocks, so a failure was invisible and
 * the optimistic UI kept the wrong number on screen. This returns the
 * server-authoritative counts so the client can reconcile.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const identity = getAnonIdentity();

  try {
    const limit = rateLimit(
      `interact:${clientKey(req, identity.id)}`,
      RATE_LIMITS.interact.limit,
      RATE_LIMITS.interact.windowMs,
    );

    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Slow down a moment.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
      );
    }

    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
    }

    const { reaction, vote } = (payload ?? {}) as Record<string, unknown>;

    let updated;

    if (typeof reaction === 'string') {
      if (!VALID_REACTIONS.has(reaction)) {
        return NextResponse.json({ error: 'Unknown reaction.' }, { status: 400 });
      }
      updated = toggleReaction(params.id, identity.id, reaction as ReactionType);
    } else if (vote === 1 || vote === -1) {
      updated = castVote(params.id, identity.id, vote);
    } else {
      return NextResponse.json(
        { error: 'Provide either a reaction or a vote of 1 or -1.' },
        { status: 400 },
      );
    }

    if (!updated) {
      return NextResponse.json({ error: 'That spill no longer exists.' }, { status: 404 });
    }

    const response = NextResponse.json({ confession: updated }, { status: 200 });
    return attachAnonIdentity(response, identity);
  } catch (err) {
    console.error('[POST /api/confessions/[id]/interact]', err);
    return NextResponse.json({ error: 'Could not record that.' }, { status: 500 });
  }
}
