-- ====================================================================
-- SpillBoard (v2.0) — Supabase PostgreSQL Database Schema
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. Profiles Table (Anonymous User Handles & Stats)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    anon_handle TEXT UNIQUE NOT NULL,
    email TEXT,
    karma BIGINT DEFAULT 0 NOT NULL,
    streak_days INT DEFAULT 1 NOT NULL,
    last_active_date DATE DEFAULT CURRENT_DATE,
    badges JSONB DEFAULT '[]'::jsonb NOT NULL,
    handle_rerolls_today INT DEFAULT 0 NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE NOT NULL,
    premium_expires_at TIMESTAMPTZ,
    city TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- --------------------------------------------------------------------
-- 2. Confessions Table (Core Content & AI Ratings)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.confessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    anon_handle_snapshot TEXT NOT NULL,
    title TEXT,
    body TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'relationship',
    tea_score INT DEFAULT 50 NOT NULL CHECK (tea_score >= 0 AND tea_score <= 100),
    tea_temperature TEXT NOT NULL DEFAULT '☕ Warm Tea',
    ai_verdict TEXT NOT NULL,
    ai_vibe_tag TEXT NOT NULL DEFAULT 'Main Character Moment',
    reaction_counts JSONB DEFAULT '{"tea": 0, "spicy": 0, "dead": 0, "yikes": 0, "red_flag": 0, "iconic": 0}'::jsonb NOT NULL,
    upvotes INT DEFAULT 0 NOT NULL,
    downvotes INT DEFAULT 0 NOT NULL,
    comment_count INT DEFAULT 0 NOT NULL,
    city TEXT,
    is_flagged BOOLEAN DEFAULT FALSE NOT NULL,
    flag_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- --------------------------------------------------------------------
-- 3. Reactions Table (Per-user emoji reactions)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    confession_id UUID REFERENCES public.confessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT NOT NULL, -- 'tea', 'spicy', 'dead', 'yikes', 'red_flag', 'iconic'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_confession_reaction UNIQUE (confession_id, user_id)
);

-- --------------------------------------------------------------------
-- 4. Votes Table (Tea vs Trash)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    confession_id UUID REFERENCES public.confessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    vote_value INT NOT NULL CHECK (vote_value IN (1, -1)), -- 1 = Tea, -1 = Trash
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_confession_vote UNIQUE (confession_id, user_id)
);

-- --------------------------------------------------------------------
-- 5. Comments Table (Anonymous Threaded Comments)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    confession_id UUID REFERENCES public.confessions(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    anon_handle_snapshot TEXT NOT NULL,
    body TEXT NOT NULL,
    upvotes INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- --------------------------------------------------------------------
-- 6. Cashfree Orders Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    cashfree_order_id TEXT NOT NULL UNIQUE,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR' NOT NULL,
    status TEXT DEFAULT 'PENDING' NOT NULL,
    plan TEXT NOT NULL DEFAULT 'spillboard_plus',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- --------------------------------------------------------------------
-- 7. Reports & Moderation Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    confession_id UUID REFERENCES public.confessions(id) ON DELETE CASCADE NOT NULL,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- --------------------------------------------------------------------
-- 8. Activity Log Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ====================================================================
-- Indexes for High Performance
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_confessions_user_id ON public.confessions(user_id);
CREATE INDEX IF NOT EXISTS idx_confessions_created_at ON public.confessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_tea_score ON public.confessions(tea_score DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_category ON public.confessions(category);

CREATE INDEX IF NOT EXISTS idx_reactions_confession_id ON public.reactions(confession_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON public.reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_votes_confession_id ON public.votes(confession_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON public.votes(user_id);

CREATE INDEX IF NOT EXISTS idx_comments_confession_id ON public.comments(confession_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- ====================================================================
-- Row Level Security (RLS) Policies
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Confessions Policies
CREATE POLICY "Confessions are publicly readable" ON public.confessions FOR SELECT USING (is_flagged = false);
CREATE POLICY "Authenticated users can post confessions" ON public.confessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own confessions" ON public.confessions FOR UPDATE USING (auth.uid() = user_id);

-- Reactions Policies
CREATE POLICY "Reactions are publicly readable" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Users can manage own reactions" ON public.reactions FOR ALL USING (auth.uid() = user_id);

-- Votes Policies
CREATE POLICY "Votes are publicly readable" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users can manage own votes" ON public.votes FOR ALL USING (auth.uid() = user_id);

-- Comments Policies
CREATE POLICY "Comments are publicly readable" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Orders Policies
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);

-- Reports Policies
CREATE POLICY "Authenticated users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Activity Log Policies
CREATE POLICY "Users can view own activity log" ON public.activity_log FOR SELECT USING (auth.uid() = user_id);
