'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Category, Confession, FeedTab, ReactionType } from '@/types';
import { ApiError, fetchConfessions, sendReaction, sendVote } from '@/lib/api/client';

/**
 * Owns all feed state: the list, the active tab and desk, and every
 * interaction.
 *
 * This exists because the old home page and ConfessionCard each held their own
 * copy of the counts and both incremented on a single click, so reactions
 * visibly double-counted. There is now exactly one owner, and the card is a
 * pure render of what it is handed.
 */
export interface UseFeedOptions {
  initial?: Confession[];
  initialTab?: FeedTab;
  /** Restrict the feed to the viewer's own filings (profile page). */
  mine?: boolean;
}

export function useFeed({ initial = [], initialTab = 'hot', mine = false }: UseFeedOptions = {}) {
  const [confessions, setConfessions] = useState<Confession[]>(initial);
  const [tab, setTab] = useState<FeedTab>(initialTab);
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [loading, setLoading] = useState(initial.length === 0);
  const [error, setError] = useState<string | null>(null);

  /* Bumped to force a refetch without changing tab or desk. */
  const [reloadKey, setReloadKey] = useState(0);

  /* Guards against a slow earlier request resolving after a newer one. */
  const requestRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestRef.current;

    setLoading(true);
    setError(null);

    fetchConfessions(tab, category, { mine }, controller.signal)
      .then((data) => {
        if (requestId !== requestRef.current) return;
        setConfessions(data);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || requestId !== requestRef.current) return;
        setError(
          err instanceof ApiError ? err.message : 'Could not reach the newsroom.',
        );
      })
      .finally(() => {
        if (requestId !== requestRef.current) return;
        setLoading(false);
      });

    return () => controller.abort();
  }, [tab, category, mine, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  /** Replace one confession with the server's authoritative version. */
  const merge = useCallback((updated: Confession) => {
    setConfessions((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  const react = useCallback(
    async (id: string, reaction: ReactionType) => {
      /* Snapshot for rollback: the old code never rolled back a failed
       * optimistic update, so the UI kept a number the server had rejected. */
      let snapshot: Confession | undefined;

      setConfessions((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          snapshot = c;

          const counts = { ...c.reaction_counts };
          const previous = c.user_reaction;

          if (previous === reaction) {
            counts[reaction] = Math.max(0, (counts[reaction] || 0) - 1);
            return { ...c, reaction_counts: counts, user_reaction: undefined };
          }

          if (previous) counts[previous] = Math.max(0, (counts[previous] || 0) - 1);
          counts[reaction] = (counts[reaction] || 0) + 1;
          return { ...c, reaction_counts: counts, user_reaction: reaction };
        }),
      );

      try {
        merge(await sendReaction(id, reaction));
      } catch (err) {
        if (snapshot) merge(snapshot);
        toast.error(err instanceof ApiError ? err.message : 'Reaction did not save.');
      }
    },
    [merge],
  );

  const vote = useCallback(
    async (id: string, value: 1 | -1) => {
      let snapshot: Confession | undefined;

      setConfessions((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          snapshot = c;

          let { upvotes, downvotes } = c;
          const previous = c.user_vote;

          if (previous === 1) upvotes = Math.max(0, upvotes - 1);
          if (previous === -1) downvotes = Math.max(0, downvotes - 1);

          if (previous === value) {
            return { ...c, upvotes, downvotes, user_vote: undefined };
          }

          if (value === 1) upvotes += 1;
          else downvotes += 1;

          return { ...c, upvotes, downvotes, user_vote: value };
        }),
      );

      try {
        merge(await sendVote(id, value));
      } catch (err) {
        if (snapshot) merge(snapshot);
        toast.error(err instanceof ApiError ? err.message : 'Vote did not save.');
      }
    },
    [merge],
  );

  /** Put a freshly filed spill at the top without a round trip. */
  const prepend = useCallback((confession: Confession) => {
    setConfessions((prev) => [confession, ...prev.filter((c) => c.id !== confession.id)]);
  }, []);

  return {
    confessions,
    tab,
    category,
    loading,
    error,
    setTab,
    setCategory,
    react,
    vote,
    prepend,
    reload,
  };
}
