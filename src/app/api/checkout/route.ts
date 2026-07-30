import { NextResponse } from 'next/server';
import { getAnonIdentity } from '@/lib/auth/anon-session';
import { PLAN } from '@/lib/constants';

/**
 * POST /api/checkout
 *
 * Creates a Cashfree payment session.
 *
 * The old pricing page faked this entirely: a 1800ms setTimeout followed by a
 * "Premium features unlocked!" toast, with no order, no payment, and no change
 * to `is_premium`. That is worse than no payment flow, because it tells the user
 * they bought something they did not.
 *
 * This is the real request shape. It returns 501 when credentials are absent so
 * the UI can say so plainly instead of lying.
 */

const CASHFREE_ENDPOINTS = {
  sandbox: 'https://sandbox.cashfree.com/pg/orders',
  production: 'https://api.cashfree.com/pg/orders',
} as const;

export async function POST(req: Request) {
  /* Names match .env.example — do not invent new ones. */
  const appId = process.env.CASHFREE_CLIENT_ID;
  const secret = process.env.CASHFREE_CLIENT_SECRET;
  const mode =
    process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox';

  if (!appId || !secret) {
    return NextResponse.json(
      {
        error:
          'Payments are not configured on this deployment. Set CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET.',
        code: 'NOT_CONFIGURED',
      },
      { status: 501 },
    );
  }

  const identity = getAnonIdentity();
  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? '';

  try {
    const orderId = `sb_${Date.now()}_${identity.id.slice(0, 8)}`;

    const response = await fetch(CASHFREE_ENDPOINTS[mode], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': process.env.CASHFREE_API_VERSION ?? '2023-08-01',
        'x-client-id': appId,
        'x-client-secret': secret,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: PLAN.amount,
        order_currency: PLAN.currency,
        customer_details: {
          /* Anonymous by design: no email or phone is collected anywhere in this
           * product, so the opaque visitor id is the only customer reference. */
          customer_id: identity.id,
          customer_name: identity.handle,
        },
        order_meta: {
          return_url: `${origin}/pricing?order={order_id}`,
        },
        order_note: PLAN.label,
      }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      console.error('[POST /api/checkout] Cashfree rejected the order:', payload);
      return NextResponse.json(
        { error: 'The payment provider rejected the order.' },
        { status: 502 },
      );
    }

    /* payment_session_id is what the Cashfree SDK needs to open checkout. */
    return NextResponse.json(
      { orderId, paymentSessionId: payload?.payment_session_id, mode },
      { status: 201 },
    );
  } catch (err) {
    console.error('[POST /api/checkout]', err);
    return NextResponse.json({ error: 'Could not start checkout.' }, { status: 500 });
  }
}
