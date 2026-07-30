# 🏗️ SpillBoard Architecture & Design Document

> **System Overview:** High-throughput, anonymous confession web application with AI-powered "Tea Temperature" scoring, real-time social reactions, viral shareable card generation, and multi-tier LLM failover.

---

## 1. System Architecture Diagram

```
                              +-------------------------+
                              |   Client (Browser/PWA)  |
                              |  Next.js 14 + Tailwind  |
                              +------------+------------+
                                           |
                                           v
                              +-------------------------+
                              |    Cloudflare Edge      |
                              | DNS / SSL / WAF / CDN   |
                              +------------+------------+
                                           |
                                           v
                              +-------------------------+
                              |      Vercel Hosting     |
                              | Next.js App Router (SSR)|
                              +-----+--------------+----+
                                    |              |
           +------------------------+              +-----------------------+
           |                                                               |
           v                                                               v
+----------------------+                                      +------------------------+
|    AI Rater Engine   |                                      |    Supabase Database   |
+----------------------+                                      | PostgreSQL 15 + Auth   |
| 1. Groq (Primary)    |                                      +------------------------+
| 2. NVIDIA NIM/Gemini |                                      | RLS Policies           |
| 3. Smart Heuristic   |                                      | Indexed Foreign Keys   |
+----------------------+                                      | Real-time Subscriptions|
                                                              +------------------------+
```

---

## 2. AI Rating & Moderation Pipeline

Every submitted confession passes through a 3-tier resilient evaluation pipeline:

```
[User Confession Submit]
          |
          v
[1. Regex Safety Pre-Filter] ----(Fails: Doxxing/Phone/Names)----> [Block Submission]
          |
          v (Passes)
[2. AI Moderation Check] --------(Fails: Hate/Threats/Abuse)-----> [Reject Post]
          |
          v (Safe)
[3. Multi-LLM Tea Scoring]
    |---> Try Groq Llama-3.3-70b-versatile
    |     |--(Success)--> Return JSON {tea_score, temperature, verdict, vibe_tag}
    |
    |---> Failover: NVIDIA NIM / Gemini 1.5 Flash
    |     |--(Success)--> Return JSON {tea_score, temperature, verdict, vibe_tag}
    |
    +---> Failover: Smart Heuristic Engine (Fallback)
          |-------------> Calculate deterministic tea score & savage roast formula
```

---

## 3. Security & True Anonymity Architecture

1. **User Identity Separation**:
   - `auth.users` contains Google OAuth / Email details.
   - `profiles` table maps `user_id` to `anon_handle` (e.g. `SpicyAvocado_842`).
   - All public endpoints (`/api/confessions`, `/api/comments`) SELECT ONLY `anon_handle` or `anon_handle_snapshot`.
   - `email` and `user_id` are never returned in public queries.

2. **Row Level Security (RLS)**:
   - `confessions`: Public SELECT (read). INSERT enabled for authenticated users. UPDATE/DELETE restricted to author or service role.
   - `reactions`: Public SELECT. Users can insert/delete only their own reactions (`user_id = auth.uid()`).
   - `profiles`: Public SELECT of `anon_handle`, `karma`, `streak_days`, `badges`. Private column updates restricted to `user_id = auth.uid()`.

3. **Rate Limiting**:
   - Upstash Redis sliding window algorithm limits confession submissions to max 3 posts / 10 minutes per IP/User.

---

## 4. Free-Tier Infrastructure Mapping

- **Vercel**: Edge SSR, static asset distribution, serverless function invocation.
- **Supabase**: PostgreSQL 15, Auth JWT verification, RLS policies, Storage buckets.
- **Groq API**: High-speed Llama 3.3 inference (free tier limits: 30 RPM).
- **NVIDIA NIM & Gemini API**: Fallback LLM inference for 99.9% AI uptime.
- **Cloudflare**: Global DNS, HTTPS termination, DDoS protection.
- **Cashfree Sandbox**: UPI & Card checkout testing environment.
