import { cookies } from 'next/headers';
import { generateAnonHandle } from '@/lib/utils/anon-handles';

/**
 * Anonymous visitor identity.
 *
 * The old build hardcoded `user_id: 'user-current-me'` in five separate places,
 * so every visitor was literally the same user: reactions and votes could not be
 * attributed, deduplicated, or rate limited per person.
 *
 * This issues an opaque per-browser id in an httpOnly cookie. It is deliberately
 * not authentication — it carries no claims and grants no privileges — it only
 * distinguishes one anonymous visitor from another.
 */

const ID_COOKIE = 'sb_anon_id';
const HANDLE_COOKIE = 'sb_anon_handle';
const ONE_YEAR = 60 * 60 * 24 * 365;

export interface AnonIdentity {
  id: string;
  handle: string;
  /** True when the cookie did not exist and must be written by the caller. */
  isNew: boolean;
}

function newId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Read the current identity, minting one in memory if absent. */
export function getAnonIdentity(): AnonIdentity {
  const store = cookies();
  const id = store.get(ID_COOKIE)?.value;
  const handle = store.get(HANDLE_COOKIE)?.value;

  if (id && handle) return { id, handle, isNew: false };

  return { id: id ?? newId(), handle: handle ?? generateAnonHandle(), isNew: true };
}

/**
 * Persist an identity onto a response. Route handlers must call this because
 * Server Components are not allowed to set cookies.
 */
export function attachAnonIdentity(response: Response, identity: AnonIdentity): Response {
  if (!identity.isNew) return response;

  const opts = `Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax; HttpOnly${
    process.env.NODE_ENV === 'production' ? '; Secure' : ''
  }`;

  response.headers.append('Set-Cookie', `${ID_COOKIE}=${identity.id}; ${opts}`);
  response.headers.append(
    'Set-Cookie',
    `${HANDLE_COOKIE}=${encodeURIComponent(identity.handle)}; ${opts}`,
  );

  return response;
}

/** Replace the stored byline. Returns the new handle. */
export function rerollAnonHandle(response: Response): string {
  const handle = generateAnonHandle();
  const opts = `Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax; HttpOnly${
    process.env.NODE_ENV === 'production' ? '; Secure' : ''
  }`;
  response.headers.append(
    'Set-Cookie',
    `${HANDLE_COOKIE}=${encodeURIComponent(handle)}; ${opts}`,
  );
  return handle;
}
