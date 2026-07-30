import type { Category, ReactionType, TemperatureScale } from '@/types';

/**
 * Single source of truth for the product's taxonomy.
 *
 * Previously the category list existed three times with three different label
 * sets (Sidebar: "All Drama"/"Secrets", SpillTeaModal: "Deep Secret"/"Petty
 * Drama", ConfessionCard: emoji-only), and score-to-colour logic existed in two
 * places with conflicting nuclear thresholds. Everything derives from here now.
 */

/* ------------------------------------------------------------------ */
/* Thermal tiers                                                       */
/* ------------------------------------------------------------------ */

export type TierKey = 'ice' | 'luke' | 'warm' | 'hot' | 'spicy' | 'nuclear';

export interface Tier {
  key: TierKey;
  /** Matches the TemperatureScale union stored on a confession. */
  label: TemperatureScale;
  /** Label without the emoji, for accessible text and share cards. */
  name: string;
  emoji: string;
  min: number;
  max: number;
  /** Hex mirror of the --tier CSS variable in globals.css. */
  hex: string;
  /** Short editorial descriptor used in verdict headers. */
  blurb: string;
}

export const TIERS: readonly Tier[] = [
  {
    key: 'ice',
    label: '🥶 Ice Cold',
    name: 'Ice Cold',
    emoji: '🥶',
    min: 0,
    max: 20,
    hex: '#0047FF',
    blurb: 'No notes. No drama. Nothing.',
  },
  {
    key: 'luke',
    label: '😐 Lukewarm',
    name: 'Lukewarm',
    emoji: '😐',
    min: 21,
    max: 40,
    hex: '#00968F',
    blurb: 'Mildly interesting at best.',
  },
  {
    key: 'warm',
    label: '☕ Warm Tea',
    name: 'Warm Tea',
    emoji: '☕',
    min: 41,
    max: 60,
    hex: '#C98A00',
    blurb: 'Drinkable. Not memorable.',
  },
  {
    key: 'hot',
    label: '🔥 Hot',
    name: 'Hot',
    emoji: '🔥',
    min: 61,
    max: 80,
    hex: '#FF6B00',
    blurb: 'Now we are talking.',
  },
  {
    key: 'spicy',
    label: '🌶️ Spicy',
    name: 'Spicy',
    emoji: '🌶️',
    min: 81,
    max: 95,
    hex: '#FF1F4B',
    blurb: 'Genuinely scandalous.',
  },
  {
    key: 'nuclear',
    label: '💀 NUCLEAR',
    name: 'Nuclear',
    emoji: '💀',
    min: 96,
    max: 100,
    hex: '#D10000',
    blurb: 'Front page. Evacuate the building.',
  },
] as const;

/** Clamp any number into the 0-100 scoring range. */
export function clampScore(score: number): number {
  /* NaN has no meaningful position on the scale, so it floors to 0. Infinities
   * do — they clamp to the nearest bound like any out-of-range number. */
  if (Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Resolve a score to its tier. Single authority — replaces the old
 * `getMeterClass` (nuclear at >=90), `getScoreColor` (nuclear at >=90) and the
 * ai-rater's own ladder (nuclear at >=96), which disagreed with each other.
 */
export function getTier(score: number): Tier {
  const s = clampScore(score);
  for (const tier of TIERS) {
    if (s <= tier.max) return tier;
  }
  return TIERS[TIERS.length - 1];
}

export function getTierByLabel(label: TemperatureScale): Tier {
  return TIERS.find((t) => t.label === label) ?? TIERS[0];
}

/** The threshold at which a spill earns front-page treatment. */
export const NUCLEAR_THRESHOLD = 96;
/** The threshold at which the reveal fires confetti. */
export const CELEBRATION_THRESHOLD = 75;

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export interface CategoryMeta {
  key: Category;
  /** Newspaper-desk framing, e.g. a section name on a masthead. */
  label: string;
  emoji: string;
  /** Placeholder shown in the composer for this desk. */
  prompt: string;
}

export const CATEGORIES: readonly CategoryMeta[] = [
  {
    key: 'relationship',
    label: 'Heartbreak Desk',
    emoji: '💔',
    prompt: 'The situationship, the betrayal, the group chat receipts...',
  },
  {
    key: 'work',
    label: 'Payroll Desk',
    emoji: '💼',
    prompt: 'What you did to your manager, your Slack, or the shared drive...',
  },
  {
    key: 'family',
    label: 'Bloodline Desk',
    emoji: '🏠',
    prompt: 'The family group chat has no idea...',
  },
  {
    key: 'school',
    label: 'Campus Desk',
    emoji: '🎓',
    prompt: 'The exam, the attendance sheet, the roommate...',
  },
  {
    key: 'secret',
    label: 'Sealed Files',
    emoji: '🔒',
    prompt: 'The thing you have never typed out anywhere...',
  },
  {
    key: 'hot_take',
    label: 'Op-Ed',
    emoji: '🎤',
    prompt: 'The opinion that would get you cancelled...',
  },
  {
    key: 'embarrassing',
    label: 'Cringe Files',
    emoji: '😭',
    prompt: 'The moment you still think about at 3am...',
  },
  {
    key: 'petty',
    label: 'Petty Crimes',
    emoji: '😈',
    prompt: 'Small revenge, immaculately executed...',
  },
] as const;

export const CATEGORY_MAP: Record<Category, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.key] = c;
    return acc;
  },
  {} as Record<Category, CategoryMeta>,
);

export function getCategory(key: Category | string | undefined): CategoryMeta {
  if (key && key in CATEGORY_MAP) return CATEGORY_MAP[key as Category];
  return CATEGORIES[0];
}

/* ------------------------------------------------------------------ */
/* Reactions                                                           */
/* ------------------------------------------------------------------ */

export interface ReactionMeta {
  key: ReactionType;
  emoji: string;
  /** Accessible name — the old pills were emoji + bare number, unreadable
   *  to a screen reader. */
  label: string;
}

export const REACTIONS: readonly ReactionMeta[] = [
  { key: 'tea', emoji: '🍵', label: 'Tea' },
  { key: 'spicy', emoji: '🌶️', label: 'Spicy' },
  { key: 'dead', emoji: '💀', label: 'Dead' },
  { key: 'yikes', emoji: '😬', label: 'Yikes' },
  { key: 'red_flag', emoji: '🚩', label: 'Red flag' },
  { key: 'iconic', emoji: '👑', label: 'Iconic' },
] as const;

/* ------------------------------------------------------------------ */
/* Feed tabs                                                           */
/* ------------------------------------------------------------------ */

export interface FeedTabMeta {
  key: 'hot' | 'fresh' | 'top' | 'city';
  label: string;
  emoji: string;
  hint: string;
}

export const FEED_TABS: readonly FeedTabMeta[] = [
  { key: 'hot', label: 'Front Page', emoji: '🔥', hint: 'Highest heat right now' },
  { key: 'fresh', label: 'Just In', emoji: '🕐', hint: 'Newest spills first' },
  { key: 'top', label: 'All Time', emoji: '👑', hint: 'Most upvoted ever' },
  { key: 'city', label: 'Local Edition', emoji: '📍', hint: 'Spills near you' },
] as const;

/* ------------------------------------------------------------------ */
/* Content limits — one authority                                      */
/* ------------------------------------------------------------------ */

/**
 * The old build disagreed across three layers: the form allowed 1000 chars,
 * moderation rejected above 600 with a message that said 500, and the PRD said
 * 500. Anything 601-1000 was accepted by the UI then rejected server-side.
 */
export const LIMITS = {
  bodyMin: 20,
  bodyMax: 600,
  titleMax: 120,
  commentMin: 2,
  commentMax: 300,
  cityMax: 60,
  freeSpillsPerDay: 3,
  feedPageSize: 30,
} as const;

/* ------------------------------------------------------------------ */
/* Badges                                                             */
/* ------------------------------------------------------------------ */

export interface BadgeMeta {
  key: string;
  label: string;
  emoji: string;
  description: string;
}

export const BADGES: readonly BadgeMeta[] = [
  {
    key: 'first_spill',
    label: 'Cub Reporter',
    emoji: '🍵',
    description: 'Filed your first spill.',
  },
  {
    key: 'tea_master',
    label: 'Tea Master',
    emoji: '🫖',
    description: 'Ten spills filed.',
  },
  {
    key: 'nuclear_spiller',
    label: 'Nuclear Spiller',
    emoji: '💀',
    description: `Scored ${NUCLEAR_THRESHOLD}+ on a single spill.`,
  },
  {
    key: 'hot_streak',
    label: 'Hot Streak',
    emoji: '🔥',
    description: 'Seven-day filing streak.',
  },
  {
    key: 'iconic_status',
    label: 'Iconic Status',
    emoji: '👑',
    description: 'Earned 500 iconic reactions.',
  },
] as const;

export const BADGE_MAP: Record<string, BadgeMeta> = BADGES.reduce(
  (acc, b) => {
    acc[b.key] = b;
    return acc;
  },
  {} as Record<string, BadgeMeta>,
);

/* ------------------------------------------------------------------ */
/* Subscription                                                       */
/* ------------------------------------------------------------------ */

/**
 * Press Pass plan.
 *
 * Lives here rather than in the checkout route: App Router route files may only
 * export recognised names (HTTP verbs, `dynamic`, `revalidate`, ...), so an
 * exported `PLAN` there is a hard build error.
 */
export const PLAN = {
  amount: 149,
  currency: 'INR',
  amountDisplay: '\u20B9149',
  amountUsdDisplay: '$3.99',
  label: 'SpillBoard Press Pass — 1 month',
} as const;

/* ------------------------------------------------------------------ */
/* Site                                                               */
/* ------------------------------------------------------------------ */

export const SITE = {
  name: 'SpillBoard',
  tagline: 'The Anonymous Scandal Sheet',
  /** Single authority for the canonical URL — layout said vercel.app while the
   *  share card stamped spillboard.app. Env name matches .env.example. */
  url: process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://spillboard.vercel.app',
  get domain(): string {
    return this.url.replace(/^https?:\/\//, '');
  },
} as const;
