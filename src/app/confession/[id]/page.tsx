'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { Confession, ReactionType } from '@/types';
import { INITIAL_CONFESSIONS } from '@/lib/store/mock-store';
import { useProfile } from '@/lib/hooks/useProfile';
import { sendReaction, sendVote } from '@/lib/api/client';
import { ConfessionCard } from '@/components/feed/ConfessionCard';
import { CommentSection } from '@/components/comment/CommentSection';
import { ShareCard } from '@/components/feed/ShareCard';
import { EmptyState } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

/**
 * Single-confession permalink.
 *
 * The old version fell back to `INITIAL_CONFESSIONS[0]` for any unknown id,
 * making the not-found branch unreachable and showing a wrong confession under
 * a valid-looking URL. It also had no-op `onReact`/`onVote` handlers so
 * interactions on this page were silently discarded.
 */
export default function ConfessionPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';

  const { profile } = useProfile();

  /* Seed from the in-memory store so the page is populated on first render
   * without a round trip. A real Supabase integration would fetch by id here. */
  const initial = INITIAL_CONFESSIONS.find((c) => c.id === id) ?? null;

  const [confession, setConfession] = useState<Confession | null>(initial);
  const [shareTarget, setShareTarget] = useState<Confession | null>(null);

  if (!confession) {
    return (
      <div className="mx-auto max-w-column px-4 py-16">
        <EmptyState
          emoji="🗞️"
          title="Spill not found"
          action={
            <Link href="/">
              <Button variant="primary">Back to the front page</Button>
            </Link>
          }
        >
          That filing may have been retracted or never existed.
        </EmptyState>
      </div>
    );
  }

  async function handleReact(cId: string, reaction: ReactionType) {
    try {
      const updated = await sendReaction(cId, reaction);
      setConfession(updated);
    } catch {
      toast.error('Reaction did not save.');
    }
  }

  async function handleVote(cId: string, value: 1 | -1) {
    try {
      const updated = await sendVote(cId, value);
      setConfession(updated);
    } catch {
      toast.error('Vote did not save.');
    }
  }

  return (
    <>
      <div className="mx-auto w-full max-w-column px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-ink-muted underline-offset-2 hover:text-ink hover:underline"
        >
          <ArrowLeft aria-hidden className="size-3.5" />
          Front page
        </Link>

        <ConfessionCard
          confession={confession}
          onReact={handleReact}
          onVote={handleVote}
          onShare={setShareTarget}
          featured
        />

        <div className="mt-8">
          <CommentSection
            confessionId={confession.id}
            userHandle={profile?.anon_handle ?? 'Anonymous'}
          />
        </div>
      </div>

      <ShareCard
        confession={shareTarget}
        onClose={() => setShareTarget(null)}
        isPremium={profile?.is_premium}
      />
    </>
  );
}
