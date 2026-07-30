import { NextResponse } from 'next/server';
import { LIMITS } from '@/lib/constants';
import { addComment, findConfession, listComments } from '@/lib/store/server-store';
import { sanitizeText } from '@/lib/utils/moderation';
import { attachAnonIdentity, getAnonIdentity } from '@/lib/auth/anon-session';
import { clientKey, rateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/confessions/[id]/comments
 *
 * The old CommentSection kept comments purely in local component state, so every
 * comment vanished on navigation and the confession's comment_count never moved.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    if (!findConfession(params.id)) {
      return NextResponse.json({ error: 'That spill no longer exists.' }, { status: 404 });
    }
    return NextResponse.json({ comments: listComments(params.id) }, { status: 200 });
  } catch (err) {
    console.error('[GET comments]', err);
    return NextResponse.json({ error: 'Could not load replies.' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const identity = getAnonIdentity();

  try {
    const limit = rateLimit(
      `comment:${clientKey(req, identity.id)}`,
      RATE_LIMITS.comment.limit,
      RATE_LIMITS.comment.windowMs,
    );

    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many replies too quickly.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
      );
    }

    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
    }

    const { body, parentId } = (payload ?? {}) as Record<string, unknown>;

    if (typeof body !== 'string') {
      return NextResponse.json({ error: 'A reply body is required.' }, { status: 400 });
    }

    const clean = sanitizeText(body);

    if (clean.length < LIMITS.commentMin) {
      return NextResponse.json({ error: 'Say a little more than that.' }, { status: 400 });
    }

    if (clean.length > LIMITS.commentMax) {
      return NextResponse.json(
        { error: `Replies are capped at ${LIMITS.commentMax} characters.` },
        { status: 400 },
      );
    }

    const comment = addComment(
      params.id,
      identity.id,
      identity.handle,
      clean,
      typeof parentId === 'string' ? parentId : undefined,
    );

    if (!comment) {
      return NextResponse.json({ error: 'That spill no longer exists.' }, { status: 404 });
    }

    const response = NextResponse.json({ comment }, { status: 201 });
    return attachAnonIdentity(response, identity);
  } catch (err) {
    console.error('[POST comments]', err);
    return NextResponse.json({ error: 'Could not post that reply.' }, { status: 500 });
  }
}
