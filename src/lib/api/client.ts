import type { Category, Comment, Confession, FeedTab, Profile, TeaRatingResult } from '@/types';

/**
 * Browser-side API client.
 *
 * Replaces the old `confessions-service`, which ran Supabase queries and the AI
 * rater directly from the browser. Every call now goes through a route handler,
 * which means: API keys stay server-side, ranking is computed in one place, and
 * failures surface as real errors instead of being swallowed by empty catch
 * blocks while the UI claimed success.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    /* Network-level failure: no response at all. */
    throw new ApiError('Network unreachable. Check your connection.', 0);
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new ApiError(
      payload?.error ?? `Request failed with status ${response.status}.`,
      response.status,
      payload?.code,
    );
  }

  return payload as T;
}

/* ------------------------------------------------------------------ */
/* Feed                                                               */
/* ------------------------------------------------------------------ */

export interface FeedQuery {
  city?: string;
  /** Restrict to the caller's own filings. */
  mine?: boolean;
}

export async function fetchConfessions(
  tab: FeedTab = 'hot',
  category: Category | 'all' = 'all',
  query: FeedQuery = {},
  signal?: AbortSignal,
): Promise<Confession[]> {
  const params = new URLSearchParams({ tab, category });
  if (query.city) params.set('city', query.city);
  if (query.mine) params.set('mine', '1');

  const data = await request<{ confessions: Confession[] }>(
    `/api/confessions?${params.toString()}`,
    { signal, cache: 'no-store' },
  );

  return data.confessions;
}

export interface SpillInput {
  body: string;
  category: Category;
  title?: string;
  city?: string;
}

export async function submitConfession(
  input: SpillInput,
): Promise<{ confession: Confession; rating: TeaRatingResult }> {
  return request<{ confession: Confession; rating: TeaRatingResult }>('/api/spill', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/* ------------------------------------------------------------------ */
/* Interactions                                                       */
/* ------------------------------------------------------------------ */

/** Returns the server-authoritative confession so the client can reconcile. */
export async function sendReaction(
  confessionId: string,
  reaction: string,
): Promise<Confession> {
  const data = await request<{ confession: Confession }>(
    `/api/confessions/${confessionId}/interact`,
    { method: 'POST', body: JSON.stringify({ reaction }) },
  );
  return data.confession;
}

export async function sendVote(confessionId: string, vote: 1 | -1): Promise<Confession> {
  const data = await request<{ confession: Confession }>(
    `/api/confessions/${confessionId}/interact`,
    { method: 'POST', body: JSON.stringify({ vote }) },
  );
  return data.confession;
}

/* ------------------------------------------------------------------ */
/* Comments                                                           */
/* ------------------------------------------------------------------ */

export async function fetchComments(
  confessionId: string,
  signal?: AbortSignal,
): Promise<Comment[]> {
  const data = await request<{ comments: Comment[] }>(
    `/api/confessions/${confessionId}/comments`,
    { signal, cache: 'no-store' },
  );
  return data.comments;
}

export async function postComment(
  confessionId: string,
  body: string,
  parentId?: string,
): Promise<Comment> {
  const data = await request<{ comment: Comment }>(
    `/api/confessions/${confessionId}/comments`,
    { method: 'POST', body: JSON.stringify({ body, parentId }) },
  );
  return data.comment;
}

/* ------------------------------------------------------------------ */
/* Profile                                                            */
/* ------------------------------------------------------------------ */

export async function fetchProfile(signal?: AbortSignal): Promise<Profile> {
  const data = await request<{ profile: Profile }>('/api/profile', {
    signal,
    cache: 'no-store',
  });
  return data.profile;
}

export async function rerollHandle(): Promise<Profile> {
  const data = await request<{ profile: Profile }>('/api/profile', { method: 'POST' });
  return data.profile;
}
