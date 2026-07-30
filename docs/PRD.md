# 🍵 SpillBoard — Product Requirements Document (v2.0)

> **Tagline:** *"Anonymous confessions, public reactions. The internet's hottest tea, brewed daily."*
> **Platform:** Web App (Next.js) — Mobile-responsive, PWA-ready
> **Date:** May 2026
> **Note:** This is the web-app rewrite of the original app-based PRD.

---

## 1. Problem Statement

Everyone has secrets they want to share but can't. Reddit confessions go viral daily. Whisper died. Yik Yak died twice. But the appetite for **anonymous, juicy, public confessions** has never been higher.

**SpillBoard** is a modern anonymous confession platform where Gen-Z drops their hottest tea, an AI rates each confession with a "Tea Temperature" and savage verdict, the public reacts and votes, and every confession becomes a **viral-ready shareable card**.

---

## 2. Vision

Build the **internet's anonymous confession campfire** — where anyone can spill relationship drama, work secrets, family chaos, crush confessions, and embarrassing moments. AI hilariously rates each confession with a **Tea Score (0–100°F)** and a one-line roast, and every post becomes a branded shareable card designed for Instagram Stories, TikTok, and Twitter virality.

---

## 3. Target Audience / Personas

| Persona | Age | Behavior | Why They Use SpillBoard |
|---|---|---|---|
| **Tea Lover Tara** | 16–24 | Doom-scrolls Reddit confessions, screenshots drama for group chats | Endless juicy anonymous content, vote on drama |
| **Confessor Kai** | 18–28 | Has secrets they can't share IRL | Vent anonymously, get validated by strangers |
| **Drama Dev** | 20–32 | Tech-savvy, shares viral apps | Loves novelty + shareable content |
| **Meme-page Maya** | 16–22 | Runs meme accounts on IG/TikTok | Mines content — each card = a ready-made post |
| **Lurker Raj** | 18–30 | Never posts, always reads | Infinite feed of juicy stories |

**Primary Market:** India (Hindi-English Gen-Z) + Global English Gen-Z

---

## 4. Core Value Proposition

| Hook | What It Does |
|---|---|
| 🎭 **True Anonymity** | Vent without judgment — auto-generated anonymous handles |
| 🍵 **AI Tea Rating** | Every confession gets a Tea Temperature (🥶→🔥) + savage roast |
| 📸 **Screenshot Viral** | Every confession card is designed to be screenshotted and shared |
| 🗳️ **Public Court** | Community votes "Tea or Trash" — democracy of drama |
| 🏆 **Trending Tea** | Daily/weekly leaderboards of hottest confessions |
| 🏙️ **Hyper-Local** | City/college-wise tea — your local gossip board |

---

## 5. Tea Rating System

### 5.1 How Tea Scoring Works

Users submit anonymous confessions. AI reads and returns:

```json
{
  "tea_score": 87,
  "temperature": "🌶️ Spicy",
  "verdict": "BFFR this is criminal behavior 💀 Your friend group needs an investigation.",
  "vibe_tag": "Red Flag Central",
  "category_auto": "relationship"
}
```

### 5.2 Tea Temperature Scale

| Temperature | Score Range | Emoji | Meaning |
|---|---|---|---|
| 🥶 **Ice Cold** | 0–20 | Snowflake | "This isn't tea, this is tap water" |
| 😐 **Lukewarm** | 21–40 | Meh face | "Mildly interesting, not spill-worthy" |
| ☕ **Warm Tea** | 41–60 | Tea cup | "Decent tea, would sip casually" |
| 🔥 **Hot** | 61–80 | Fire | "NOW we're talking. This is real tea." |
| 🌶️ **Spicy** | 81–95 | Chili | "SCREAMING. This needs to go viral." |
| 💀 **NUCLEAR** | 96–100 | Skull | "FBI should be involved. Legendary tea." |

### 5.3 Vibe Tags (AI-assigned)

- "Main Character Moment" ✨
- "NPC Behavior" 🗿
- "Red Flag Central" 🚩
- "Villain Origin Story" 😈
- "Rom-Com Plot" 💕
- "Cope Arc" 🤡
- "Sigma Grindset" 💪
- "Therapy Needed" 😭
- "Iconic" 👑
- "Chronically Online" 📱

---

## 6. Core Features (MVP — Phase 1)

### 6.1 Authentication
- **Google OAuth** (primary — one-tap signup)
- **Email + password** (secondary)
- Cookie-based sessions via `@supabase/ssr`
- Auto-generated **anonymous handle** on signup (e.g., "SpicyAvocado_842", "ChaosGoblin_127")
- Handle re-roll: 1x/day free | Premium: unlimited
- No real identity visible anywhere public

### 6.2 Spill Tea (Post Confession)
- **Body text** (max 500 chars) — the confession
- **Title** (optional, max 100 chars)
- **Category tags:**
  - 💔 Relationship
  - 💼 Work
  - 🏠 Family
  - 🎓 School/College
  - 🤐 Secret
  - 🔥 Hot Take
  - 🤡 Embarrassing
  - 💀 Petty
- Auto-anonymous posting (handle only, never real name)
- **AI Moderation** on submit: filters hate speech, illegal content, doxxing, personal info
- Submit → AI Tea Rating generated → Card appears in feed

### 6.3 AI Tea Rating (The Wow Moment)
On confession submission:
1. **Loading animation** — tea kettle boiling, steam rising
2. **Temperature reveal** — thermometer animation fills up
3. **Tea Score** — big number counter rolls to final score
4. **Verdict** — savage one-liner types out letter by letter
5. **Vibe Tag** — badge appears with pop animation
6. Card is ready — auto-posted to feed + shareable

### 6.4 Public Feed
- **Tabs:**
  - 🔥 **Hot** — most reacted in last 24h
  - ✨ **Fresh** — newest confessions
  - 👑 **Top** — highest tea scores (daily/weekly/all-time)
  - 🏙️ **My City** — location-based (optional)
- Infinite scroll with skeleton loaders
- Category filter pills at top
- Sort by: Tea Score, Reactions, Newest, Most Controversial

### 6.5 Confession Card (The Viral Component)
- **Tea-stained paper aesthetic** with watercolor texture
- Card shows:
  - Anonymous handle + created timestamp
  - Category tag badge
  - Confession text (beautiful typography)
  - Tea Score circle (with temperature gradient: blue→red)
  - AI Verdict (italic, savage)
  - Vibe Tag badge
  - Reaction bar
  - Vote buttons (Tea ☕ / Trash 🗑️)
- **Glowing border** based on temperature:
  - Blue glow = cold tea
  - Orange glow = hot tea
  - Red pulse = nuclear tea
- Share button → downloadable image card

### 6.6 Reactions & Voting
- **Reactions** (one per user per confession):
  - 🍵 Tea (respect the spill)
  - 🔥 Spicy (extra hot)
  - 💀 Dead (killed me)
  - 😬 Yikes
  - 🚩 Red Flag
  - ✨ Iconic
- **Votes:** "Tea" (upvote, this is real tea) or "Trash" (downvote, not tea-worthy)
- Animated counters
- Vote ratio affects feed ranking

### 6.7 Anonymous Comments
- Threaded comments (1 level deep for MVP)
- Each commenter gets their own anonymous handle per thread
- AI moderation on comments
- Like/dislike on comments
- Max 200 chars per comment

### 6.8 Trending & Leaderboards
- **Today's Hottest Tea** — top 10 confessions by tea score + reactions
- **Tea of the Week** — Hall of Fame
- **Top Spillers** — anonymous handles with most karma
- **Tea Category Trends** — which category is hottest today
- **Nuclear Tea Archive** — all-time highest scored confessions

### 6.9 Anonymous Profile
- Anonymous handle (publicly visible)
- **Tea Karma** — accumulated from upvotes on your confessions
- **Streak** — consecutive days posting
- **Badges:**
  - First Spill, Tea Master (50 confessions), Drama Queen/King (most reactions)
  - Nuclear Achievement (96+ tea score), Hot Streak (7 days)
  - Iconic (100+ upvotes on single confession)
- Stats: Total spills, Average tea score, Hottest confession
- Profile is always anonymous — no way to connect to real identity

### 6.10 Shareable Card Generator
- One-tap generates branded image:
  - Tea-stained paper background
  - Confession text in stylized typography
  - Tea Score with temperature gradient circle
  - AI verdict
  - "SpillBoard 🍵" watermark (removed in premium)
  - QR code linking to the confession
- Download PNG / Copy link / Share to WhatsApp, IG, Twitter

### 6.11 Content Moderation
- **AI pre-moderation:** Every post runs through content filter before publishing
- **Community reporting:** Flag button on every confession + comment
- **Auto-remove:** Posts with 5+ flags go to review queue
- **Banned patterns:** Personal names, phone numbers, addresses, explicit threats
- Moderation log for admin review

---

## 7. Monetization Strategy

### 7.1 Premium Tier — SpillBoard+ (₹149/mo or $3.99/mo)

| Feature | Free | Premium |
|---|---|---|
| Confessions per day | 3 | Unlimited |
| Handle re-rolls | 1x/day | Unlimited |
| AI Tea Rating | Standard | Extra savage + spicier verdicts |
| Card themes | Default | 6 premium designs |
| Share cards | With watermark | No watermark |
| Ads | Banner ads in feed | Ad-free |
| Comments | 5/day | Unlimited |
| Tea of the Week vote | No | Yes — premium users vote for "Tea of the Week" |
| Boost | No | Boost 1 confession/day to top of Fresh |

### 7.2 Advertising Revenue
- Banner ads between every 5th feed card (AdSense)
- Interstitial ad after every 3rd tea rating (free users)
- Target: ₹5-15 RPM (India), $2-8 RPM (US/UK)

### 7.3 In-App Purchases (Phase 2)
- **Tea Coins** (virtual currency):
  - Tip viral confessions (creator earns karma)
  - Unlock premium reaction packs
  - Boost confessions to trending
- **Verified Anonymous** badge (₹99 one-time): confirms you're a real user, not a bot
- **Custom card themes** (₹49 per pack)

---

## 8. Tech Stack (100% Free-Tier & Trial Ecosystem)

| Layer | Technology | Free Tier / Trial Allocation | Purpose |
|---|---|---|---|
| **Framework** | Next.js 14+ (App Router) | Free | React 18, Server Components, SSR, API routes |
| **Language** | TypeScript (strict) | Free | Complete end-to-end type safety |
| **Styling** | Tailwind CSS 4 + shadcn/ui | Free | "Midnight Tea House" theme design tokens |
| **Animations** | Framer Motion | Free | Tea kettle reveal, thermometer score roll |
| **Auth** | Supabase Auth (`@supabase/ssr`) | Free (50k MAU) | Cookie sessions, Google OAuth, email/password |
| **Database** | Supabase PostgreSQL | Free (500MB) | RLS policies, indexed tables, real-time |
| **Primary AI LLM** | Groq (`llama-3.3-70b-versatile`) | Free (30 req/min) | Ultra-fast tea scoring, roasts & vibe tags |
| **Secondary AI LLM** | NVIDIA NIM / Gemini 1.5 Flash | Trial / Free Tier | Failover LLM engine for zero downtime |
| **DNS & DDoS** | Cloudflare | Free Tier | Edge caching, SSL/TLS, DDoS protection |
| **Rate Limiting** | Upstash Redis | Free (10k ops/day) | Anti-abuse sliding window rate limiter |
| **CI/CD** | GitHub Actions | Free (2,000 min/mo) | Type checking (`npx tsc`), linting, build checks |
| **Payments** | Cashfree Sandbox | Free Sandbox | Test environment for subscriptions & Drop UI |
| **Image Export** | `html-to-image` | Free | Client-side PNG card screenshot generator |
| **Icons & Toasts** | Lucide React + Sonner | Free | UI icons & stackable notification toasts |
| **Hosting** | Vercel | Free Hobby | Automatic Git deployments & serverless functions |

---

## 9. Data Models

### profiles
```
id              UUID (PK, FK → auth.users)
anon_handle     TEXT UNIQUE
email           TEXT (private, never exposed)
karma           BIGINT (default 0)
streak_days     INT (default 0)
last_active_date DATE
badges          JSONB (default '[]')
handle_rerolls_today INT (default 0)
is_premium      BOOLEAN (default false)
premium_expires_at TIMESTAMPTZ
city            TEXT (optional)
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### confessions
```
id                  UUID (PK)
user_id             UUID (FK → auth.users, CASCADE)
anon_handle_snapshot TEXT
title               TEXT (optional, max 100)
body                TEXT (max 500)
category            TEXT
tea_score           INT (0-100)
tea_temperature     TEXT
ai_verdict          TEXT
ai_vibe_tag         TEXT
reaction_counts     JSONB (default '{}')
upvotes             INT (default 0)
downvotes           INT (default 0)
comment_count       INT (default 0)
city                TEXT (optional)
is_flagged          BOOLEAN (default false)
flag_count          INT (default 0)
created_at          TIMESTAMPTZ
```

### reactions
```
id              UUID (PK)
confession_id   UUID (FK → confessions, CASCADE)
user_id         UUID (FK → auth.users, CASCADE)
type            TEXT (🍵🔥💀😬🚩✨)
created_at      TIMESTAMPTZ
UNIQUE(confession_id, user_id)
```

### votes
```
id              UUID (PK)
confession_id   UUID (FK → confessions, CASCADE)
user_id         UUID (FK → auth.users, CASCADE)
value           INT (1 = Tea, -1 = Trash)
created_at      TIMESTAMPTZ
UNIQUE(confession_id, user_id)
```

### comments
```
id                  UUID (PK)
confession_id       UUID (FK → confessions, CASCADE)
parent_id           UUID (FK → comments, nullable)
user_id             UUID (FK → auth.users, CASCADE)
anon_handle_snapshot TEXT
body                TEXT (max 200)
upvotes             INT (default 0)
created_at          TIMESTAMPTZ
```

### orders (Cashfree)
```
id                  UUID (PK)
user_id             UUID (FK → auth.users, CASCADE)
cashfree_order_id   TEXT
amount              DECIMAL
currency            TEXT (default 'INR')
status              TEXT (PENDING/PAID/FAILED)
plan                TEXT
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

### reports (content moderation)
```
id              UUID (PK)
confession_id   UUID (FK → confessions, CASCADE)
reporter_id     UUID (FK → auth.users, CASCADE)
reason          TEXT
status          TEXT (pending/reviewed/dismissed)
created_at      TIMESTAMPTZ
```

### activity_log
```
id          UUID (PK)
user_id     UUID (FK → auth.users, CASCADE)
action      TEXT
metadata    JSONB
created_at  TIMESTAMPTZ
```

---

## 10. UI Design Vision

### Color System — "Midnight Tea House"
```
Background:     #0c0a14 (deep midnight purple-black)
Surface:        #16132a (card backgrounds — dark purple)
Border:         #2a2545 (subtle purple borders)
Primary:        #E67E22 → #D35400 (warm tea amber gradient)
Tea Cold:       #3498DB (ice blue)
Tea Hot:        #E74C3C (hot red)
Tea Nuclear:    #FF0040 (neon red pulse)
Accent Gold:    #F1C40F
Accent Purple:  #9B59B6
Text Primary:   #FAFAFA
Text Secondary: #8E8BA3
```

### Typography
- **Display/Headlines:** Playfair Display (elegant, editorial — like a gossip magazine)
- **Body/UI:** Plus Jakarta Sans (modern, clean)
- **Monospace/Scores:** JetBrains Mono (tea score numbers)

### Visual Elements
- **Tea-stained paper texture** for confession cards (subtle watercolor effect)
- **Steam/smoke particles** rising from hot confessions
- **Thermometer animation** for tea score reveal
- **Wax seal stamps** for vibe tags
- **Dark ambient glow** — confession cards emit colored light based on tea temperature
- **Subtle tea cup icon** animations throughout
- **Editorial/magazine feel** — like reading a gossip column
- **Ink splatter effects** on nuclear-tier confessions

### Layout
- **Desktop:** Feed (center, wide) + Sidebar right (Trending Tea, Top Spillers)
- **Mobile:** Full-width feed + bottom nav
- **Breakpoints:** Mobile-first → sm:640 → md:768 → lg:1024 → xl:1280

---

## 11. Viral Hooks Recap

1. ✅ **AI Tea Rating** — every confession = entertainment
2. ✅ **Savage AI verdict** — the roast IS the content
3. ✅ **Screenshot-ready cards** — designed for IG/TikTok
4. ✅ **Anonymous = unfiltered** — people share what they'd never say publicly
5. ✅ **"Tea or Trash" voting** — democratic drama judging
6. ✅ **Trending leaderboard** — FOMO on missing hot tea
7. ✅ **Category diversity** — relationship, work, school = everyone has tea
8. ✅ **Nuclear tier** — chase the highest tea score = gamification
9. ✅ **City/college tea** — hyper-local gossip board
10. ✅ **Streak + karma** — daily engagement habit

---

## 12. Content Moderation Strategy

| Layer | Method | What It Catches |
|---|---|---|
| **Pre-publish AI filter** | Groq/Gemini moderation prompt | Hate speech, threats, doxxing, explicit content |
| **Regex patterns** | Server-side validation | Phone numbers, emails, addresses, full names |
| **Community reports** | Flag button (3 flags = auto-hide) | Harassment, bullying, spam |
| **Manual review queue** | Admin dashboard | Edge cases, appeals |
| **Rate limiting** | Upstash Redis | Spam prevention |

### Moderation Rules
- No real names (first + last)
- No phone numbers or addresses
- No explicit sexual content (suggestive is fine)
- No threats of violence
- No doxxing or identifying information
- No promotion of self-harm
- Hate speech auto-blocked

---

## 13. MVP Scope (Phase 1 — Build Now)

- [ ] Project setup (Next.js + Tailwind + shadcn + deps)
- [ ] Supabase schema + RLS policies
- [ ] Auth (Google OAuth + email/password)
- [ ] Anonymous handle generation
- [ ] Confession submission with category
- [ ] AI Tea Rating (Groq primary, Gemini fallback)
- [ ] AI Content Moderation
- [ ] Tea rating reveal animation
- [ ] Public feed (Hot / Fresh / Top)
- [ ] Confession cards with reactions + votes
- [ ] Anonymous comments
- [ ] Trending leaderboard
- [ ] Anonymous profile + karma + badges
- [ ] Share card generator (download image)
- [ ] Landing page
- [ ] Premium page + Cashfree payments
- [ ] Google AdSense integration
- [ ] Mobile responsive
- [ ] Vercel deployment

## 14. Phase 2 Backlog

- [ ] City/college-based feeds (geolocation)
- [ ] Tea Coins virtual currency
- [ ] Custom card themes
- [ ] Push notifications (PWA)
- [ ] Admin moderation dashboard
- [ ] Analytics (PostHog)
- [ ] Daily "Hottest Tea" email newsletter
- [ ] Comment threading (deeper)
- [ ] User blocking
- [ ] Search confessions

## 15. Phase 3 Future

- [ ] Mobile native app
- [ ] Audio confessions (voice disguised)
- [ ] Brand sponsored tea
- [ ] Live tea rooms (anonymous voice chat)
- [ ] AI persona companions for venting
- [ ] Creator program for top spillers

---

## 14. Success Metrics

| Metric | Target |
|---|---|
| D1 Retention | > 30% |
| D7 Retention | > 12% |
| Confessions per user/day | > 1.5 |
| Share rate | > 15% of confessions shared externally |
| Avg session duration | > 8 minutes |
| Premium conversion | > 2.5% of MAU |
| Ad RPM | > ₹6 (India) / $2.5 (US) |

---

## 15. Risk Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Cyberbullying/harassment | App removal, legal issues | 3-layer moderation (AI + community + manual) |
| Doxxing via confessions | Legal liability | Regex + AI filter for personal info |
| Low quality posts / spam | User churn | Rate limiting + minimum character count + AI quality filter |
| Content moderation costs | Margin squeeze | AI moderation first, manual review only for flagged content |
| Anonymous abuse | Platform reputation | IP-based shadow banning, device fingerprinting |
| App store rejection | Distribution blocked | Web-first approach avoids app store gatekeeping |
