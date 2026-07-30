const ADJECTIVES = [
  'Spicy', 'Chaos', 'Midnight', 'Savage', 'Secret', 'Petty', 'Iconic',
  'Nuclear', 'Crimson', 'Shadow', 'Ghostly', 'Velvet', 'Toxic', 'Cosmic',
  'Bitter', 'Sweet', 'Cursed', 'Unfiltered', 'Wicked', 'Golden',
  'Feral', 'Deadpan', 'Gilded', 'Rogue', 'Lurking', 'Brazen',
] as const;

const NOUNS = [
  'Avocado', 'Goblin', 'Llama', 'Phantom', 'Phoenix', 'Raven', 'Teacup',
  'Viper', 'Whisper', 'Panther', 'Kitten', 'Dragon', 'Jester', 'Oracle',
  'Barista', 'Outlaw', 'Enigma', 'Siren', 'Spectre', 'Vampire',
  'Informant', 'Columnist', 'Stenographer', 'Kettle', 'Bystander', 'Understudy',
] as const;

/**
 * Anonymous byline generator.
 *
 * Uses crypto randomness where available so handles are not predictable from
 * timing; falls back to Math.random on older runtimes.
 */
function randomInt(max: number): number {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    /* Modulo bias is negligible at these list sizes. */
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export function generateAnonHandle(): string {
  const adj = ADJECTIVES[randomInt(ADJECTIVES.length)];
  const noun = NOUNS[randomInt(NOUNS.length)];
  const num = 100 + randomInt(900);
  return `${adj}${noun}_${num}`;
}

/** Deterministic avatar glyph so a handle always renders the same mark. */
const GLYPHS = ['🎭', '🫖', '🔥', '💀', '👑', '🌶️', '🃏', '🕵️', '📰', '🗝️'] as const;

export function handleGlyph(handle: string): string {
  let hash = 0;
  for (let i = 0; i < handle.length; i += 1) {
    hash = (hash * 31 + handle.charCodeAt(i)) % 100000;
  }
  return GLYPHS[hash % GLYPHS.length];
}

export const MAX_REROLLS_PER_DAY = 3;

/*
 * Badge metadata now lives in `@/lib/constants` (BADGES / BADGE_MAP) as the
 * single authority. The previous ALL_BADGES map here duplicated it with
 * different names and emoji ("First Tea" vs "Cub Reporter", 👑 vs 🫖).
 */
export { BADGES, BADGE_MAP } from '@/lib/constants';
export type { BadgeMeta } from '@/lib/constants';
