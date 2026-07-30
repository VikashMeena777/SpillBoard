'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Profile } from '@/types';
import { ApiError, fetchProfile, rerollHandle } from '@/lib/api/client';

/**
 * The viewer's anonymous profile, resolved from the server cookie identity.
 *
 * Replaces reading `INITIAL_PROFILE` straight out of the mock store on five
 * separate pages, which meant every visitor rendered the same hardcoded byline
 * and karma.
 */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [rerolling, setRerolling] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetchProfile(controller.signal)
      .then(setProfile)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.error('[useProfile] load failed:', err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  /** Returns an error message on failure, or null on success. */
  const reroll = useCallback(async (): Promise<string | null> => {
    setRerolling(true);
    try {
      setProfile(await rerollHandle());
      return null;
    } catch (err) {
      return err instanceof ApiError ? err.message : 'Could not change your byline.';
    } finally {
      setRerolling(false);
    }
  }, []);

  return { profile, loading, rerolling, reroll, setProfile };
}
