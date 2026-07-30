# 🎨 Figma Design System & Architecture Spec: SpillBoard (v3.0)

**Figma Account Connected**: `Vikash Meena` (`vikashmeena52420@gmail.com`)  
**Figma User ID**: `1469895451663143037`

---

## 1. Design Vision & Concept
SpillBoard (v3.0) is built as a **High-Fashion Modern Gossip Gazette**. It replaces outdated dark mode layouts with a rich, luminous, multi-layered visual experience combining **Neo-Noir Velvet**, **Acid Emerald**, and **Cyber Neon Accents**.

---

## 2. Figma Color Palette & Tokens

| Figma Token Name | Hex Code | Purpose |
|---|---|---|
| `figma/bg/obsidian-velvet` | `#0B0716` | Main application backdrop |
| `figma/surface/luminous-card` | `#140D28` | Primary confession card background |
| `figma/surface/card-hover` | `#20163C` | Interactive hover state |
| `figma/border/violet-glass` | `#32235E` | Structural glass borders |
| `figma/accent/acid-emerald` | `#00FF87` | Primary actions & verified badges |
| `figma/accent/neon-pink` | `#FF007A` | Nuclear tea temperature (90°F+) |
| `figma/accent/sunset-amber` | `#FF9900` | Hot tea temperature (60-80°F) |
| `figma/accent/cyber-cyan` | `#00F0FF` | Cold tea temperature (<60°F) |
| `figma/accent/electric-purple` | `#7928CA` | Hero glows & gradient fills |

---

## 3. Figma Typography Hierarchy

```
Display Header : Outfit (Weights: 700, 800, 900)
Subheaders     : Space Grotesk (Weights: 600, 700)
Metadata/Score : JetBrains Mono (Weights: 500, 700)
Body Content   : Plus Jakarta Sans (Weights: 400, 500, 600)
```

- **Hero Title**: `font-outfit text-4xl sm:text-5xl lg:text-6xl font-black`
- **Confession Title**: `font-outfit text-xl font-bold`
- **AI Roast Verdict**: `font-grotesk text-xs sm:text-sm italic`
- **Handle Tag**: `font-mono text-xs font-bold`

---

## 4. UI Components & Layout Components

### A. Live Marquee Ticker Banner
Top fixed banner with real-time scrolling scandal updates (`"🔥 LIVE COURT: @SpicyAvocado_842 spilled Mumbai tea..."`), pulse indicator, and gradient fill.

### B. Liquid Thermometer Edge Gauge
Confession cards feature a 5px left-side border (`gauge-nuclear`, `gauge-hot`, `gauge-cold`) that dynamically illuminates and casts glowing radial shadows based on the AI tea score.

### C. Holographic Wax Seal Stamp
AI Vibe Tags (`✨ Red Flag Central`) are enclosed inside a dashed wax-seal badge (`stamp-seal`) with metallic text shadow.

### D. Interactive Reaction Bar
6 emoji reaction pills (🍵🔥💀😬🚩✨) with active spring scale animations and optimistic live count updates.

---

## 5. Deployment & Code Verification
- `docs/FIGMA_DESIGN_SYSTEM.md`: Generated design specification.
- `src/lib/services/confessions-service.ts`: Live Supabase integration with memory fallback.
- `npx tsc --noEmit`: 0 errors.
- `npm run build`: 10/10 static & dynamic production routes pass.
