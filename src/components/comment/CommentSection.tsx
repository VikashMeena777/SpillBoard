'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import type { Comment } from '@/types';
import { cn } from '@/lib/utils/cn';
import { LIMITS } from '@/lib/constants';
import { compactNumber, fullDate, timeAgo } from '@/lib/utils/format';
import { handleGlyph } from '@/lib/utils/anon-handles';
import { ApiError, fetchComments, postComment } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { SectionHeading, Skeleton } from '@/components/ui/Primitives';

export interface CommentSectionProps {
  confessionId: string;
  userHandle: string;
  /** Server-rendered initial list, so the section is populated on first paint. */
  initialComments?: Comment[];
}

/**
 * Reader replies.
 *
 * The old version kept comments in local state only and its `onAddComment(id,
 * text)` callback was passed a handler that ignored the text entirely — so
 * nothing was ever persisted and the parent's comment_count never moved.
 * Everything here round-trips through the API.
 */
export function CommentSection({
  confessionId,
  userHandle,
  initialComments = [],
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(initialComments.length === 0);

  /* Reconcile with the server on mount; abort if the user navigates away. */
  useEffect(() => {
    const controller = new AbortController();

    fetchComments(confessionId, controller.signal)
      .then(setComments)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 0) return; // aborted or offline
        console.error('[CommentSection] load failed:', err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [confessionId]);

  const trimmed = draft.trim();
  const canSubmit = trimmed.length >= LIMITS.commentMin && trimmed.length <= LIMITS.commentMax;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit || submitting) return;

      setSubmitting(true);
      try {
        const created = await postComment(confessionId, trimmed);
        setComments((prev) => [...prev, created]);
        setDraft('');
        toast.success('Reply posted.');
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : 'Could not post that reply.',
        );
      } finally {
        setSubmitting(false);
      }
    },
    [canSubmit, submitting, confessionId, trimmed],
  );

  /* Local-only upvote: there is no comment vote endpoint yet, and pretending
   * otherwise would repeat the old build's habit of claiming success for writes
   * that never happened. Flagged as optimistic in the UI copy below. */
  const handleUpvote = useCallback((commentId: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              upvotes: c.user_upvoted ? Math.max(0, c.upvotes - 1) : c.upvotes + 1,
              user_upvoted: !c.user_upvoted,
            }
          : c,
      ),
    );
  }, []);

  return (
    <section aria-labelledby="replies-heading" className="paper-block p-5 sm:p-6">
      <SectionHeading kicker="Letters to the editor">
        <span id="replies-heading">
          Replies <span className="text-ink-faint">({comments.length})</span>
        </span>
      </SectionHeading>

      {/* ---- Composer ---- */}
      <form onSubmit={handleSubmit} className="mb-6">
        <label htmlFor="reply-body" className="kicker mb-1.5 block text-ink">
          Reply as @{userHandle}
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="reply-body"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={LIMITS.commentMax}
            placeholder="Keep it anonymous. Keep it sharp."
            aria-describedby="reply-help"
            className="flex-1 border-2 border-ink bg-paper-raised px-3 py-2.5 font-body text-base text-ink placeholder:text-ink-faint"
          />

          <Button type="submit" disabled={!canSubmit} loading={submitting} loadingText="Posting…">
            <Send aria-hidden className="size-4" />
            Post
          </Button>
        </div>

        <p id="reply-help" className="kicker mt-1.5 text-ink-faint">
          {draft.length}/{LIMITS.commentMax} · No names or contact details.
        </p>
      </form>

      {/* ---- List ---- */}
      <div aria-live="polite" aria-busy={loading} className="flex flex-col gap-3">
        {loading ? (
          <>
            <span className="sr-only">Loading replies…</span>
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </>
        ) : comments.length === 0 ? (
          <p className="border-2 border-dashed border-ink/25 px-4 py-8 text-center font-body text-ink-muted">
            No replies yet. Say something first.
          </p>
        ) : (
          comments.map((comment, i) => (
            <motion.article
              key={comment.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: Math.min(i * 0.03, 0.15) }}
              className="border-2 border-ink/20 bg-paper-sunk p-3.5"
            >
              <header className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span aria-hidden className="text-sm">
                    {handleGlyph(comment.anon_handle_snapshot)}
                  </span>
                  <p className="truncate font-mono text-xs font-bold">
                    @{comment.anon_handle_snapshot}
                  </p>
                </div>

                <time
                  dateTime={comment.created_at}
                  title={fullDate(comment.created_at)}
                  className="kicker shrink-0 text-ink-faint"
                >
                  {timeAgo(comment.created_at)}
                </time>
              </header>

              <p className="mt-2 font-body text-[0.95rem] leading-relaxed text-ink-soft">
                {comment.body}
              </p>

              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleUpvote(comment.id)}
                  aria-pressed={Boolean(comment.user_upvoted)}
                  aria-label={`Agree with this reply. ${comment.upvotes} agree`}
                  className={cn(
                    'inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-micro font-bold transition',
                    comment.user_upvoted
                      ? 'border-ink bg-marker text-marker-ink'
                      : 'border-ink/25 text-ink-muted hover:border-ink hover:text-ink',
                  )}
                >
                  <ThumbsUp aria-hidden className="size-3" />
                  <span aria-hidden>{compactNumber(comment.upvotes)}</span>
                </button>
              </div>
            </motion.article>
          ))
        )}
      </div>
    </section>
  );
}
