# 🧵 Stitch Design System & Typography Specification: SpillBoard

## 1. Design Philosophy
SpillBoard is an anonymous Gen-Z gossip teahouse built on high contrast, brutalist typography, dynamic heat indicators, and live atmospheric elements. The design language fuses **Y2K Underground Press** with **Tokyo Cyberpunk Teahouse** aesthetics.

---

## 2. Color System & Design Tokens

| Token | Hex / Value | Usage |
|---|---|---|
| `color-bg-obsidian` | `#090714` | Main page background |
| `color-surface-card` | `#130e26` | Card & modal background tiles |
| `color-surface-hover` | `#231b46` | Interactive hover state |
| `color-border-violet` | `#362a63` | Structural borders |
| `color-acid-green` | `#00FF66` | Verified Tea CTA & success badges |
| `color-neon-crimson` | `#FF0055` | Nuclear Tier (90°F+) temperature badge |
| `color-amber-tea` | `#FFB800` | Hot Tier (60-80°F) temperature badge |
| `color-cyan-cold` | `#00F0FF` | Cold Tier (<60°F) temperature badge |
| `color-cyber-purple` | `#7928CA` | Accent highlights & gradient fills |
| `color-text-pearl` | `#F6F5FC` | Primary text |
| `color-text-muted` | `#A096B5` | Secondary metadata & timestamps |

---

## 3. Typography Scale & Fonts

```
Header / Title Display : Dela Gothic One (Brutal, heavy, Japanese gothic)
Subheader / Verdicts   : Syne (ExtraBold 800)
Monospace / Badges     : Space Mono (Letter-spaced stamp tags)
Body Copy              : Plus Jakarta Sans (Geometric sans-serif)
```

- **H1 Headline**: `font-dela text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white`
- **Card Title**: `font-dela text-xl text-white mb-2`
- **Verdict Quote**: `font-syne text-xs sm:text-sm italic text-gray-200`
- **Metadata Tag**: `font-mono text-xs font-bold text-gray-100`

---

## 4. Visual Components

### A. Live Marquee Ticker
Top fixed bar with animated scrolling scandal alerts, pulse indicator, and gradient fill.

### B. Liquid Thermometer Edge Gauge
Confession cards feature a 5px left-side border (`gauge-nuclear`, `gauge-hot`, `gauge-cold`) that dynamically illuminates and casts glowing radial shadows based on the AI tea score.

### C. Holographic Wax Seal Stamp
AI Vibe Tags (`✨ Red Flag Central`) are enclosed inside a dashed wax-seal badge (`stamp-seal`) with metallic text shadow.

### D. Animated Steam & Embers
Interactive tea kettle icon with boiling steam particle animation (`animate-boil`).

---

## 5. Implementation Status
- `tailwind.config.ts`: Updated with design tokens, custom font families (`font-dela`, `font-syne`, `font-sans`, `font-mono`), and keyframe animations.
- `globals.css`: Updated with Y2K grid mesh backdrop, Dela Gothic Google Fonts, noise texture overlay, and liquid gauge utilities.
- `Navbar.tsx`: Integrated marquee ticker & Dela Gothic logo.
- `ConfessionCard.tsx`: Integrated liquid gauge borders & wax seal stamps.
- `page.tsx`: Integrated Cyber-Gazette hero banner and feed grid.
