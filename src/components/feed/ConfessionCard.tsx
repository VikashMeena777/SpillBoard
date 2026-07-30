'use client';

import Link from 'next/link';
import { memo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, MessageSquare, Share2, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { Confession, ReactionType } from '@/types';
import { cn } from '@/lib/utils/cn';
import { getCategory, getTier, REACTIONS } from '@/lib/constants';
import { compactNumber, fullDate, timeAgo } from '@/lib/utils/format';
import { handleGlyph } from '@/lib/utils/anon-handles';
import { totalReactions } from '@/lib/feed/ranking';
import { Badge, Kicker, ScoreStamp } from '@/components/ui/Primitives';

export interface ConfessionCardProps {
  confession: Confession;
  onReact: (confessionId: string, reaction: ReactionType) => void;
  onVote: (confessionId: string, vote: 1 | -1) => void;
  onShare: (confession: Confession) => void;
  /** Front-page lead treatment: bigger headline, drop cap. */
  featured?: boolean;
  /** Rank number for leaderboard contexts. */
  rank?: number;
  /** Disable interaction where the card is display-only. */
  readOnly?: boolean;
  index?: number;
}

/**
 * A single filed spill, presented as a tabloid news item.
 *
 * This component is deliberately **fully controlled**. The old version copied
 * five props into local useState (`counts`, `upvotes`, `downvotes`,
 * `activeReaction`, `activeVote`) with no sync effect, while the parent page
 * *also* updated its own copy optimistically. Both incremented, so every
 * reaction visibly counted twice, and because the React key stayed
 * `confession.id` across tab changes the stale local numbers survived refetches.
 * All state now lives in the parent; this renders what it is given.
 */
function ConfessionCardImpl({
  confession,
  onReact,
  onVote,
  onShare,
  featured = false,
  rank,
  readOnly = false,
  index = 0,
}: ConfessionCardProps) {
  const tier = getTier(confession.tea_score);
  const category = getCategory(confession.category);

  const netVotes = confession.upvotes - confession.downvotes;
  const totalVotes = confession.upvotes + confession.downvotes;
  const teaPercent = totalVotes > 0 ? Math.round((confession.upvotes / totalVotes) * 100) : null;

  return (
    <motion.article
      data-tier={tier.key}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      /* Cap the stagger so a full page does not take a second to appear. */
      transition={{ duration: 0.28, ease: 'easeOut', delay: Math.min(index * 0.04, 0.24) }}
      className={cn(
        'paper-block paper-block-interactive tier-spine relative',
        featured ? 'p-6 sm:p-8' : 'p-5',
      )}
      aria-labelledby={`confession-${confession.id}-heading`}
    >
      {/* Rank marker for ordered contexts */}
      {typeof rank === 'number' && (
        <div
          aria-hidden
          className="absolute -left-3 -top-3 flex size-9 items-center justify-center border-2 border-ink bg-ink font-display text-lg text-paper"
        >
          {rank}
        </div>
      )}

      {/* ---- Byline row ---- */}
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center border-2 border-ink bg-paper-sunk text-base"
          >
            {handleGlyph(confession.anon_handle_snapshot)}
          </span>

          <div className="min-w-0">
            <p className="truncate font-mono text-sm font-bold">
              @{confession.anon_handle_snapshot}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <Kicker>{category.emoji} {category.label}</Kicker>
              <span aria-hidden className="text-ink-faint">·</span>
              {/* Machine-readable timestamp with a human title. */}
              <time
                dateTime={confession.created_at}
                title={fullDate(confession.created_at)}
                className="kicker text-ink-faint"
              >
                {timeAgo(confession.created_at)}
              </time>
              {confession.city && (
                <>
                  <span aria-hidden className="text-ink-faint">·</span>
                  <span className="kicker inline-flex items-center gap-1 text-ink-faint">
                    <MapPin aria-hidden className="size-3" />
                    {confession.city}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <ScoreStamp score={confession.tea_score} size={featured ? 'lg' : 'md'} />
      </header>

      {/* ---- Headline + body ---- */}
      <div className="mt-4">
        {confession.title ? (
          <h3
            id={`confession-${confession.id}-heading`}
            className={cn(
              'text-balance font-display leading-[0.92]',
              featured ? 'text-display-sm sm:text-4xl' : 'text-2xl',
            )}
          >
            <Link
              href={`/confession/${confession.id}`}
              className="underline-offset-4 hover:underline"
            >
              {confession.title}
            </Link>
          </h3>
        ) : (
          /* Untitled spills still need an accessible name for the article. */
          <h3 id={`confession-${confession.id}-heading`} className="sr-only">
            Spill by {confession.anon_handle_snapshot}
          </h3>
        )}

        <p
          className={cn(
            'mt-3 whitespace-pre-line text-pretty font-body text-ink-soft',
            featured ? 'drop-cap text-lg leading-relaxed' : 'text-[0.95rem] leading-relaxed',
          )}
        >
          {confession.body}
        </p>
      </div>

      {/* ---- AI verdict, as a torn thermal receipt ---- */}
      <div className="receipt mt-5 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Kicker className="text-ink">Editor&apos;s Verdict</Kicker>
          <Badge variant="tier">{tier.emoji} {tier.name}</Badge>
        </div>

        <p className="mt-2 font-body text-[0.95rem] italic leading-snug text-ink">
          &ldquo;{confession.ai_verdict}&rdquo;
        </p>

        <p className="kicker mt-2 text-ink-faint">Filed as: {confession.ai_vibe_tag}</p>
      </div>

      {/* ---- Reactions ---- */}
      <div className="mt-5">
        <Kicker as="p" className="mb-2">
          Reader reactions · {compactNumber(totalReactions(confession))}
        </Kicker>

        <div className="flex flex-wrap gap-1.5">
          {REACTIONS.map((reaction) => {
            const count = confession.reaction_counts?.[reaction.key] ?? 0;
            const active = confession.user_reaction === reaction.key;

            return (
              <button
                key={reaction.key}
                type="button"
                onClick={() => onReact(confession.id, reaction.key)}
                disabled={readOnly}
                /* aria-pressed communicates toggle state; the label supplies the
                 * name the old emoji-plus-number pills never had. */
                aria-pressed={active}
                aria-label={`${reaction.label}, ${count} ${count === 1 ? 'reaction' : 'reactions'}`}
                className={cn(
                  'inline-flex items-center gap-1.5 border-2 px-2.5 py-1 font-mono text-xs font-bold transition',
                  'disabled:pointer-events-none disabled:opacity-60',
                  active
                    ? 'border-ink bg-marker text-marker-ink'
                    : 'border-ink/25 bg-paper-sunk text-ink-soft hover:border-ink hover:bg-paper-edge',
                )}
              >
                <span aria-hidden>{reaction.emoji}</span>
                <span aria-hidden>{compactNumber(count)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- Verdict bar: votes + actions ---- */}
      <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink/15 pt-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onVote(confession.id, 1)}
            disabled={readOnly}
            aria-pressed={confession.user_vote === 1}
            aria-label={`Mark as tea. ${confession.upvotes} in favour`}
            className={cn(
              'inline-flex items-center gap-1.5 border-2 px-3 py-1.5 font-mono text-xs font-bold uppercase transition',
              'disabled:pointer-events-none disabled:opacity-60',
              confession.user_vote === 1
                ? 'border-ink bg-ink text-paper'
                : 'border-ink/25 bg-paper-sunk text-ink-soft hover:border-ink hover:text-ink',
            )}
          >
            <ThumbsUp aria-hidden className="size-3.5" />
            <span aria-hidden>Tea {compactNumber(confession.upvotes)}</span>
          </button>

          <button
            type="button"
            onClick={() => onVote(confession.id, -1)}
            disabled={readOnly}
            aria-pressed={confession.user_vote === -1}
            aria-label={`Mark as trash. ${confession.downvotes} against`}
            className={cn(
              'inline-flex items-center gap-1.5 border-2 px-3 py-1.5 font-mono text-xs font-bold uppercase transition',
              'disabled:pointer-events-none disabled:opacity-60',
              confession.user_vote === -1
                ? 'border-danger bg-danger text-white'
                : 'border-ink/25 bg-paper-sunk text-ink-soft hover:border-ink hover:text-ink',
            )}
          >
            <ThumbsDown aria-hidden className="size-3.5" />
            <span aria-hidden>Trash</span>
          </button>

          {teaPercent !== null && (
            <span className="kicker hidden text-ink-faint sm:inline">
              {teaPercent}% verified · {netVotes >= 0 ? '+' : ''}
              {compactNumber(netVotes)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/confession/${confession.id}`}
            className="inline-flex items-center gap-1.5 border-2 border-ink/25 bg-paper-sunk px-3 py-1.5 font-mono text-xs font-bold text-ink-soft transition hover:border-ink hover:text-ink"
          >
            <MessageSquare aria-hidden className="size-3.5" />
            <span>{compactNumber(confession.comment_count)}</span>
            <span className="sr-only">replies</span>
          </Link>

          <button
            type="button"
            onClick={() => onShare(confession)}
            aria-label="Print a shareable card for this spill"
            className="inline-flex items-center gap-1.5 border-2 border-ink bg-marker px-3 py-1.5 font-mono text-xs font-bold uppercase text-marker-ink transition hover:bg-marker-deep"
          >
            <Share2 aria-hidden className="size-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </footer>
    </motion.article>
  );
}

export const ConfessionCard = memo(ConfessionCardImpl);
