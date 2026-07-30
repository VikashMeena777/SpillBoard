import type { Comment, Confession, Profile, ReactionType } from '@/types';
import { INITIAL_COMMENTS, INITIAL_CONFESSIONS, INITIAL_PROFILE } from './mock-store';
import { LIMITS, NUCLEAR_THRESHOLD } from '@/lib/constants';

/**
 * Server-side data store.
 *
 * Persistence strategy: Supabase when configured, otherwise this in-memory
 * store so the app is fully usable with zero backend setup.
 *
 * Two things the old implementation got wrong that this fixes:
 *
 *  1. It ran from the *browser* client, and treated an empty result set as
 *     failure (`error || !data || data.length === 0`), so a genuinely empty
 *     database was indistinguishable from a broken one and silently served mock
 *     data forever.
 *  2. It inserted a client-generated string id like `confession-1753...` into a
 *     `uuid` primary key column, which could never succeed against the real
 *     schema. Ids are UUIDs now and are never sent by the client.
 */

/* State is module-scoped, which means per server instance and reset on cold
 * start. That is acceptable for the demo fallback and is exactly what Supabase
 * replaces in production. */
let confessions: Confession[] = [...INITIAL_CONFESSIONS];
let comments: Record<string, Comment[]> = structuredCloneSafe(INITIAL_COMMENTS);
const profiles = new Map<string, Profile>();

/** Per-visitor interaction ledger, so reactions and votes cannot be stacked. */
const reactionLedger = new Map<string, ReactionType>();
const voteLedger = new Map<string, 1 | -1>();

function structuredCloneSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function newId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  /* RFC-4122-shaped fallback for runtimes without webcrypto. */
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const ledgerKey = (anonId: string, confessionId: string) => `${anonId}::${confessionId}`;

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export function listConfessions(): readonly Confession[] {
  return confessions;
}

export function findConfession(id: string): Confession | undefined {
  return confessions.find((c) => c.id === id);
}

/**
 * Attach the caller's own reaction and vote so the UI can render active state.
 * Without this the client had no way to know what it had already done.
 */
export function withViewerState(list: readonly Confession[], anonId: string): Confession[] {
  return list.map((c) => ({
    ...c,
      user_reaction: reactionLedger.get(ledgerKey(anonId, c.id)),
      user_vote: voteLedger.get(ledgerKey(anonId, c.id)),
  }));
}

export function listComments(confessionId: string): Comment[] {
  return comments[confessionId] ?? [];
}

/* ------------------------------------------------------------------ */
/* Writes                                                             */
/* ------------------------------------------------------------------ */

export interface CreateConfessionInput {
  anonId: string;
  handle: string;
  body: string;
  title?: string;
  category: Confession['category'];
  city?: string;
  tea_score: number;
  tea_temperature: Confession['tea_temperature'];
  ai_verdict: string;
  ai_vibe_tag: string;
}

export function createConfession(input: CreateConfessionInput): Confession {
  const confession: Confession = {
    id: newId(),
    user_id: input.anonId,
    anon_handle_snapshot: input.handle,
    title: input.title?.trim() || undefined,
    body: input.body.trim(),
    category: input.category,
    tea_score: input.tea_score,
    tea_temperature: input.tea_temperature,
    ai_verdict: input.ai_verdict,
    ai_vibe_tag: input.ai_vibe_tag,
    reaction_counts: { tea: 0, spicy: 0, dead: 0, yikes: 0, red_flag: 0, iconic: 0 },
    upvotes: 0,
    downvotes: 0,
    comment_count: 0,
    /* Only store a city when one was actually given. The old code defaulted
     * every row to 'Global', which is what broke the Local Edition tab. */
    city: input.city?.trim() || undefined,
    created_at: new Date().toISOString(),
  };

  confessions = [confession, ...confessions];
  awardSpillBadges(input.anonId, confession);
  return confession;
}

/**
 * Toggle a reaction for one visitor. Returns the updated confession.
 *
 * The old version incremented unconditionally on every call, so a single user
 * could inflate a count indefinitely by clicking, and there was no way to undo.
 */
export function toggleReaction(
  confessionId: string,
  anonId: string,
  reaction: ReactionType,
): Confession | undefined {
  const key = ledgerKey(anonId, confessionId);
  const previous = reactionLedger.get(key);
  const target = findConfession(confessionId);
  if (!target) return undefined;

  const counts = { ...target.reaction_counts };

  if (previous === reaction) {
    counts[reaction] = Math.max(0, (counts[reaction] || 0) - 1);
    reactionLedger.delete(key);
  } else {
    if (previous) counts[previous] = Math.max(0, (counts[previous] || 0) - 1);
    counts[reaction] = (counts[reaction] || 0) + 1;
    reactionLedger.set(key, reaction);
  }

  const updated: Confession = { ...target, reaction_counts: counts };
  confessions = confessions.map((c) => (c.id === confessionId ? updated : c));

  return { ...updated, user_reaction: reactionLedger.get(key), user_vote: voteLedger.get(key) };
}

/** Cast, switch, or retract a vote. */
export function castVote(
  confessionId: string,
  anonId: string,
  value: 1 | -1,
): Confession | undefined {
  const key = ledgerKey(anonId, confessionId);
  const previous = voteLedger.get(key);
  const target = findConfession(confessionId);
  if (!target) return undefined;

  let { upvotes, downvotes } = target;

  /* Remove the previous vote first, whatever it was. */
  if (previous === 1) upvotes = Math.max(0, upvotes - 1);
  if (previous === -1) downvotes = Math.max(0, downvotes - 1);

  if (previous === value) {
    voteLedger.delete(key);
  } else {
    if (value === 1) upvotes += 1;
    else downvotes += 1;
    voteLedger.set(key, value);
  }

  const updated: Confession = { ...target, upvotes, downvotes };
  confessions = confessions.map((c) => (c.id === confessionId ? updated : c));

  return { ...updated, user_reaction: reactionLedger.get(key), user_vote: voteLedger.get(key) };
}

export function addComment(
  confessionId: string,
  anonId: string,
  handle: string,
  body: string,
  parentId?: string,
): Comment | undefined {
  const target = findConfession(confessionId);
  if (!target) return undefined;

  const comment: Comment = {
    id: newId(),
    confession_id: confessionId,
    parent_id: parentId,
    user_id: anonId,
    anon_handle_snapshot: handle,
    body: body.trim(),
    upvotes: 0,
    created_at: new Date().toISOString(),
  };

  comments = {
    ...comments,
    [confessionId]: [...(comments[confessionId] ?? []), comment],
  };

  /* Keep the denormalised counter honest — the old build never updated it, so
   * cards showed a stale comment_count after commenting. */
  confessions = confessions.map((c) =>
    c.id === confessionId ? { ...c, comment_count: c.comment_count + 1 } : c,
  );

  return comment;
}

/* ------------------------------------------------------------------ */
/* Profiles                                                           */
/* ------------------------------------------------------------------ */

export function getProfile(anonId: string, handle: string): Profile {
  const existing = profiles.get(anonId);
  if (existing) return { ...existing, anon_handle: handle };

  /* Seed the demo profile for the first visitor so the profile page has
   * something to show; later visitors start clean. */
  const seed: Profile =
    profiles.size === 0
      ? { ...INITIAL_PROFILE, id: anonId, anon_handle: handle }
      : {
          id: anonId,
          anon_handle: handle,
          karma: 0,
          streak_days: 1,
          last_active_date: new Date().toISOString().slice(0, 10),
          badges: [],
          handle_rerolls_today: 0,
          is_premium: false,
          created_at: new Date().toISOString(),
        };

  profiles.set(anonId, seed);
  return seed;
}

export function updateProfile(anonId: string, patch: Partial<Profile>): Profile | undefined {
  const existing = profiles.get(anonId);
  if (!existing) return undefined;
  const next = { ...existing, ...patch };
  profiles.set(anonId, next);
  return next;
}

/**
 * Award badges after a spill.
 *
 * The mock profile hardcoded two badges and three others (`nuclear_spiller`,
 * `hot_streak`, `iconic_status`) were defined but unreachable because no award
 * logic existed anywhere.
 */
function awardSpillBadges(anonId: string, confession: Confession): void {
  const profile = profiles.get(anonId);
  if (!profile) return;

  const mine = confessions.filter((c) => c.user_id === anonId);
  const badges = new Set(profile.badges);

  badges.add('first_spill');
  if (mine.length >= 10) badges.add('tea_master');
  if (confession.tea_score >= NUCLEAR_THRESHOLD) badges.add('nuclear_spiller');
  if (profile.streak_days >= 7) badges.add('hot_streak');

  const iconic = mine.reduce((sum, c) => sum + (c.reaction_counts?.iconic ?? 0), 0);
  if (iconic >= 500) badges.add('iconic_status');

  profiles.set(anonId, {
    ...profile,
    badges: [...badges],
    karma: profile.karma + Math.round(confession.tea_score / 10),
  });
}

/** How many spills this visitor filed today, for the free-tier cap. */
export function spillsToday(anonId: string): number {
  const today = new Date().toISOString().slice(0, 10);
  return confessions.filter(
    (c) => c.user_id === anonId && c.created_at.slice(0, 10) === today,
  ).length;
}

export const FREE_DAILY_LIMIT = LIMITS.freeSpillsPerDay;
