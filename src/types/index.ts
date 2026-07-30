export type Category = 
  | 'relationship'
  | 'work'
  | 'family'
  | 'school'
  | 'secret'
  | 'hot_take'
  | 'embarrassing'
  | 'petty';

export type TemperatureScale = 
  | '🥶 Ice Cold'
  | '😐 Lukewarm'
  | '☕ Warm Tea'
  | '🔥 Hot'
  | '🌶️ Spicy'
  | '💀 NUCLEAR';

export type ReactionType = 'tea' | 'spicy' | 'dead' | 'yikes' | 'red_flag' | 'iconic';

export interface ReactionCounts {
  tea: number;
  spicy: number;
  dead: number;
  yikes: number;
  red_flag: number;
  iconic: number;
}

export interface Confession {
  id: string;
  user_id: string;
  anon_handle_snapshot: string;
  title?: string;
  body: string;
  category: Category;
  tea_score: number; // 0 to 100
  tea_temperature: TemperatureScale;
  ai_verdict: string;
  ai_vibe_tag: string;
  reaction_counts: ReactionCounts;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  city?: string;
  is_flagged?: boolean;
  created_at: string;
  user_reaction?: ReactionType;
  user_vote?: 1 | -1;
}

export interface Comment {
  id: string;
  confession_id: string;
  parent_id?: string;
  user_id: string;
  anon_handle_snapshot: string;
  body: string;
  upvotes: number;
  created_at: string;
  user_upvoted?: boolean;
}

export interface Profile {
  id: string;
  anon_handle: string;
  email?: string;
  karma: number;
  streak_days: number;
  last_active_date: string;
  badges: string[];
  handle_rerolls_today: number;
  is_premium: boolean;
  premium_expires_at?: string;
  city?: string;
  created_at: string;
}

export interface TeaRatingResult {
  tea_score: number;
  temperature: TemperatureScale;
  verdict: string;
  vibe_tag: string;
  category_auto?: Category;
  is_safe: boolean;
  rejection_reason?: string;
}

export type FeedTab = 'hot' | 'fresh' | 'top' | 'city';
