import { Anton, Archivo, Lora, IBM_Plex_Mono } from 'next/font/google';

/**
 * Self-hosted via next/font instead of the previous render-blocking
 * `@import url(fonts.googleapis.com)` at the top of globals.css.
 *
 * The old config also mapped `font-grotesk` to Space Grotesk without ever
 * loading it, so that class silently fell back to sans-serif everywhere.
 * Every family declared here is actually loaded and exposed as a CSS variable
 * consumed by tailwind.config.ts.
 */

/** Condensed tabloid headline scream. */
export const fontDisplay = Anton({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-display',
});

/** Grotesque for UI, buttons, and navigation. */
export const fontUI = Archivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ui',
  axes: ['wdth'],
});

/**
 * Editorial serif for confession bodies — long-form readability.
 *
 * Newsreader was the first choice but next/font 14 has no metric override data
 * for it, which is a hard build failure. Lora is the closest supported
 * equivalent: same editorial weight, real italics for the verdict quotes.
 */
export const fontBody = Lora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  style: ['normal', 'italic'],
});

/** Receipt / metadata mono. */
export const fontMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-mono',
});

export const fontVariables = [
  fontDisplay.variable,
  fontUI.variable,
  fontBody.variable,
  fontMono.variable,
].join(' ');
