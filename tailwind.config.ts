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

        /* ---- Thermal ramp: drives every score-derived accent ---- */
        thermal: {
          ice: '#0047FF',
          luke: '#00968F',
          warm: '#C98A00',
          hot: '#FF6B00',
          spicy: '#FF1F4B',
          nuclear: '#D10000',
        },

        /* ---- Semantic ---- */
        danger: '#D10000',
        success: '#00795C',

        /*
         * Legacy aliases. The previous palette used tokens that were never
         * defined (bg-surface, text-accent-gold, border-borderPurple...), so
         * those panels rendered with no background at all. These aliases are
         * intentional insurance during the redesign: any straggler class still
         * resolves to a real colour instead of transparent.
         */
        midnight: {
          DEFAULT: rgb('--paper'),
          surface: rgb('--paper-sunk'),
          card: rgb('--paper-raised'),
          hover: rgb('--paper-edge'),
          border: rgb('--rule'),
        },
        surface: {
          DEFAULT: rgb('--paper-sunk'),
          card: rgb('--paper-raised'),
          hover: rgb('--paper-edge'),
        },
        accent: {
          gold: '#C98A00',
          purple: '#0047FF',
        },
        borderPurple: rgb('--rule'),
        textMuted: rgb('--ink-muted'),
        tea: {
          amber: '#FF6B00',
          dark: '#FF1F4B',
          cold: '#0047FF',
          hot: '#FF6B00',
          nuclear: '#D10000',
        },
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
        6: '6px',
      },

      boxShadow: {
        /* Hard offset "printed block" shadows, no soft blur */
        stamp: '3px 3px 0 0 rgb(var(--ink))',
        'stamp-lg': '6px 6px 0 0 rgb(var(--ink))',
        'stamp-marker': '4px 4px 0 0 #C9E000',
        press: '1px 1px 0 0 rgb(var(--ink))',
        lift: '0 12px 28px -12px rgb(var(--ink) / 0.45)',
      },

      spacing: {
        gutter: '1.375rem',
      },

      maxWidth: {
        column: '68ch',
        broadsheet: '84rem',
      },

      backgroundImage: {
        'halftone': 'radial-gradient(rgb(var(--ink) / 0.5) 1px, transparent 1px)',
        'rule-dashed':
          'repeating-linear-gradient(90deg, rgb(var(--ink)) 0 6px, transparent 6px 12px)',
        'marker-sweep':
          'linear-gradient(104deg, transparent 0.5%, #E8FF3D 2%, #E8FF3D 97%, transparent 99%)',
      },

      backgroundSize: {
        halftone: '4px 4px',
      },

      keyframes: {
        /* Score stamp thuds onto the page */
        'stamp-in': {
          '0%': { opacity: '0', transform: 'scale(1.7) rotate(-14deg)' },
          '55%': { opacity: '1', transform: 'scale(0.94) rotate(-3deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(-5deg)' },
        },
        /* Highlighter drawn left to right */
        'marker-in': {
          '0%': { backgroundSize: '0% 100%' },
          '100%': { backgroundSize: '100% 100%' },
        },
        ticker: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        /* Kettle steam curl */
        steam: {
          '0%': { opacity: '0', transform: 'translateY(2px) scaleX(0.8)' },
          '40%': { opacity: '0.85' },
          '100%': { opacity: '0', transform: 'translateY(-9px) scaleX(1.25)' },
        },
        'grain-shift': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(-1%, 1%)' },
          '50%': { transform: 'translate(1%, -1%)' },
          '75%': { transform: 'translate(1%, 1%)' },
        },
        'rise-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-rule': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },

      animation: {
        'stamp-in': 'stamp-in 0.45s cubic-bezier(0.2, 1.4, 0.4, 1) both',
        'marker-in': 'marker-in 0.5s ease-out both',
        ticker: 'ticker 32s linear infinite',
        steam: 'steam 2.4s ease-out infinite',
        'grain-shift': 'grain-shift 8s steps(4) infinite',
        'rise-in': 'rise-in 0.4s ease-out both',
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
