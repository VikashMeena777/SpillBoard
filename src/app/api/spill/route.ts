import { NextResponse } from 'next/server';
import type { Category } from '@/types';
import { rateConfessionWithAI } from '@/lib/ai/ai-rater';
import { sanitizeText } from '@/lib/utils/moderation';
import { CATEGORY_MAP, LIMITS } from '@/lib/constants';
import {
  createConfession,
  FREE_DAILY_LIMIT,
  getProfile,
  spillsToday,
} from '@/lib/store/server-store';
import { attachAnonIdentity, getAnonIdentity } from '@/lib/auth/anon-session';
import { clientKey, rateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit';

/**
 * POST /api/spill
 *
 * The only path that creates a confession.
 *
 * Previously this route existed with no callers while the client called
 * `rateConfessionWithAI` directly from the browser — where GROQ_API_KEY and
 * GEMINI_API_KEY are undefined, so the LLMs never actually ran and every spill
 * silently fell back to the heuristic engine. Rating happens here, on the
 * server, where the keys exist.
 */
export async function POST(req: Request) {
  const identity = getAnonIdentity();

  try {
    /* Abuse ceiling on the expensive endpoint. */
    const limit = rateLimit(
      `spill:${clientKey(req, identity.id)}`,
      RATE_LIMITS.spill.limit,
      RATE_LIMITS.spill.windowMs,
    );

    if (!limit.ok) {
      return NextResponse.json(
        { error: 'You are filing too fast. Take a breath and try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
      );
    }

    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
    }

    const { body, category, title, city } = (payload ?? {}) as Record<string, unknown>;

    if (typeof body !== 'string') {
      return NextResponse.json({ error: 'A confession body is required.' }, { status: 400 });
    }

    const cleanBody = sanitizeText(body);

    /* Validate against the same LIMITS the client counter uses, so the form can
     * never accept something the server rejects. */
    if (cleanBody.length < LIMITS.bodyMin) {
      return NextResponse.json(
        { error: `Your spill needs at least ${LIMITS.bodyMin} characters.` },
        { status: 400 },
      );
    }

    if (cleanBody.length > LIMITS.bodyMax) {
      return NextResponse.json(
        { error: `Your spill must be ${LIMITS.bodyMax} characters or fewer.` },
        { status: 400 },
      );
    }

    if (typeof category !== 'string' || !(category in CATEGORY_MAP)) {
      return NextResponse.json({ error: 'Pick a valid desk for your spill.' }, { status: 400 });
    }

    const profile = getProfile(identity.id, identity.handle);

    /* Free-tier daily cap: documented in the PRD, never enforced before. */
    if (!profile.is_premium && spillsToday(identity.id) >= FREE_DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: `Free accounts can file ${FREE_DAILY_LIMIT} spills a day. Go Press Pass for unlimited.`,
          code: 'DAILY_LIMIT',
        },
        { status: 403 },
      );
    }

    const rating = await rateConfessionWithAI(cleanBody, category as Category);

    /* Moderation rejection is a 422: the request was well-formed but the content
     * is not publishable. */
    if (!rating.is_safe) {
      return NextResponse.json(
        { error: rating.rejection_reason ?? 'Rejected by the safety desk.' },
        { status: 422 },
      );
    }

    const cleanTitle = typeof title === 'string' ? sanitizeText(title).slice(0, LIMITS.titleMax) : undefined;
    const cleanCity = typeof city === 'string' ? sanitizeText(city).slice(0, LIMITS.cityMax) : undefined;

    const confession = createConfession({
      anonId: identity.id,
      handle: identity.handle,
      body: cleanBody,
      title: cleanTitle,
      category: category as Category,
      city: cleanCity,
      tea_score: rating.tea_score,
      tea_temperature: rating.temperature,
      ai_verdict: rating.verdict,
      ai_vibe_tag: rating.vibe_tag,
    });

    const response = NextResponse.json({ confession, rating }, { status: 201 });
    return attachAnonIdentity(response, identity);
  } catch (err) {
    console.error('[POST /api/spill]', err);
    return NextResponse.json(
      { error: 'The presses jammed. Try filing that again.' },
      { status: 500 },
    );
  }
}
