import type { Config } from 'tailwindcss';

/**
 * SpillBoard — "Acid Tabloid" design system.
 *
 * Concept: a scandal sheet printed on cheap newsprint. Hard rules, condensed
 * screaming headlines, ink stamps, halftone grain, highlighter marker accents.
 *
 * Colour strategy:
 *  - Surface/ink tokens are CSS variables so the paper edition and night
 *    edition invert without duplicating class names (see globals.css).
 *  - The thermal ramp is fixed across editions: it is the product's meaning
 *    layer (0-100 tea temperature) and must stay legible and consistent.
 */

/** Consume a `--var` holding a space-separated RGB triplet. */
const rgb = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        /* ---- Surfaces: newsprint stock ---- */
        paper: {
          DEFAULT: rgb('--paper'),
          sunk: rgb('--paper-sunk'),
          raised: rgb('--paper-raised'),
          edge: rgb('--paper-edge'),
        },
        /* ---- Ink: type and rules ---- */
        ink: {
          DEFAULT: rgb('--ink'),
          soft: rgb('--ink-soft'),
          muted: rgb('--ink-muted'),
          faint: rgb('--ink-faint'),
        },
        rule: rgb('--rule'),

        /* ---- Signature: highlighter marker ---- */
        marker: {
          DEFAULT: '#E8FF3D',
          deep: '#C9E000',
          ink: '#1A1D00',
        },

        /*
         * The thermal ramp is deliberately NOT a Tailwind palette. Score
         * colours are applied through the `--tier` variable (set by the
         * [data-tier] blocks in globals.css) and read in TS from TIERS[].hex.
         * A third copy here would be a silent drift risk with nothing
         * consuming it.
         */

        /* ---- Semantic ---- */
        danger: '#D10000',
        success: '#00795C',

        /*
         * The legacy aliases (midnight.*, surface.*, accent.*, borderPurple,
         * textMuted, tea.*, figma.*) that briefly lived here during the
         * redesign have been removed. They existed so any straggler class from
         * the old palette would still resolve to a real colour instead of
         * transparent. Every component has since been rebuilt and none of them
         * are referenced, so keeping them would only let a stale or misspelled
         * class silently compile again.
         */
      },

      fontFamily: {
        /* Tabloid headline scream */
        display: ['var(--font-display)', 'Impact', 'sans-serif'],
        /* Characterful UI / labels */
        ui: ['var(--font-ui)', 'ui-sans-serif', 'sans-serif'],
        sans: ['var(--font-ui)', 'ui-sans-serif', 'sans-serif'],
        /* Editorial serif for confession bodies */
        body: ['var(--font-body)', 'Georgia', 'serif'],
        serif: ['var(--font-body)', 'Georgia', 'serif'],
        /* Receipt / metadata */
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        /* Tight-leading display scale for condensed headlines */
        'display-sm': ['2.5rem', { lineHeight: '0.92', letterSpacing: '-0.01em' }],
        'display-md': ['3.75rem', { lineHeight: '0.88', letterSpacing: '-0.015em' }],
        'display-lg': ['5.5rem', { lineHeight: '0.85', letterSpacing: '-0.02em' }],
        'display-xl': ['7.5rem', { lineHeight: '0.82', letterSpacing: '-0.025em' }],
        /* Micro labels, kept above the old 9-10px accessibility floor */
        micro: ['0.6875rem', { lineHeight: '1.2', letterSpacing: '0.14em' }],
      },

      borderRadius: {
        /* Tabloid print has corners, not pills */
        DEFAULT: '2px',
        sm: '1px',
        md: '3px',
        lg: '4px',
        xl: '5px',
      },

      borderWidth: {
        3: '3px',
      },

      boxShadow: {
        /* Hard offset "printed block" shadows, no soft blur */
        stamp: '3px 3px 0 0 rgb(var(--ink))',
        'stamp-lg': '6px 6px 0 0 rgb(var(--ink))',
        press: '1px 1px 0 0 rgb(var(--ink))',
      },

      maxWidth: {
        column: '68ch',
        broadsheet: '84rem',
      },

      keyframes: {
        /* Score stamp thuds onto the page */
        'stamp-in': {
          '0%': { opacity: '0', transform: 'scale(1.7) rotate(-14deg)' },
          '55%': { opacity: '1', transform: 'scale(0.94) rotate(-3deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(-5deg)' },
        },
        /* Kettle steam curl on the masthead wordmark */
        steam: {
          '0%': { opacity: '0', transform: 'translateY(2px) scaleX(0.8)' },
          '40%': { opacity: '0.85' },
          '100%': { opacity: '0', transform: 'translateY(-9px) scaleX(1.25)' },
        },
        /* Newsprint grain drift; consumed by body::before in globals.css */
        'grain-shift': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(-1%, 1%)' },
          '50%': { transform: 'translate(1%, -1%)' },
          '75%': { transform: 'translate(1%, 1%)' },
        },
        /* Skeleton placeholder pulse */
        'pulse-rule': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },

      animation: {
        'stamp-in': 'stamp-in 0.45s cubic-bezier(0.2, 1.4, 0.4, 1) both',
        steam: 'steam 2.4s ease-out infinite',
        'grain-shift': 'grain-shift 8s steps(4) infinite',
        'pulse-rule': 'pulse-rule 1.4s ease-in-out infinite',
      },

      transitionTimingFunction: {
        thud: 'cubic-bezier(0.2, 1.4, 0.4, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
