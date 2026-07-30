import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { TeaRatingResult, Category, TemperatureScale } from '@/types';
import { checkContentSafety } from '../utils/moderation';
import { clampScore, getTier, CATEGORY_MAP } from '@/lib/constants';

/**
 * Server-only AI rating pipeline.
 *
 * This module must never be imported from a client component. The old build
 * called it directly from SpillTeaModal, where `process.env.GROQ_API_KEY` is
 * `undefined` (no NEXT_PUBLIC_ prefix), so every rating silently degraded to
 * the heuristic engine and the LLMs were effectively dead code. Ratings now go
 * through POST /api/spill.
 */

const VIBE_TAGS = [
  'Main Character Moment',
  'NPC Behavior',
  'Red Flag Central',
  'Villain Origin Story',
  'Rom-Com Plot',
  'Cope Arc',
  'Sigma Grindset',
  'Therapy Needed',
  'Iconic',
  'Chronically Online',
] as const;

const SYSTEM_PROMPT = `You are the Editor-in-Chief of SpillBoard, an anonymous scandal sheet. You judge confessions with the voice of a savage tabloid columnist: witty, blunt, Gen-Z fluent, never cruel about someone's appearance, identity, or trauma.

Return ONLY raw JSON (no markdown fences) with exactly these keys:
{
  "tea_score": integer 0-100 — how juicy, dramatic, scandalous or entertaining it is,
  "verdict": 1-2 sentences, max 180 characters, a sharp roast or reaction,
  "vibe_tag": one of ${VIBE_TAGS.map((t) => `"${t}"`).join(', ')}
}

Scoring guide:
0-20 nothing happened. 21-40 mildly interesting. 41-60 average gossip.
61-80 genuinely entertaining. 81-95 scandalous. 96-100 reserved for the truly unhinged.

Be stingy with high scores. Most confessions are not nuclear.`;

/** Shape returned by an LLM before validation. */
interface RawRating {
  tea_score?: unknown;
  verdict?: unknown;
  vibe_tag?: unknown;
}

function coerceVibeTag(value: unknown): string {
  if (typeof value === 'string') {
    const match = VIBE_TAGS.find((t) => t.toLowerCase() === value.trim().toLowerCase());
    if (match) return match;
  }
  return 'Main Character Moment';
}

function coerceVerdict(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const clean = value.trim().replace(/^["']|["']$/g, '');
  if (clean.length < 4) return fallback;
  return clean.length > 220 ? `${clean.slice(0, 217)}...` : clean;
}

/**
 * Validate an LLM payload. Returns null when the response is unusable so the
 * caller falls through to the next provider — the old code accepted any object
 * with a defined `tea_score`, including `NaN` from a non-numeric value.
 */
function parseRating(raw: string, fallbackVerdict: string): TeaRatingResult | null {
  const cleaned = raw
    .replace(/```(?:json)?/gi, '')
    .trim()
    /* Some models prepend prose; grab the first JSON object. */
    .match(/\{[\s\S]*\}/)?.[0];

  if (!cleaned) return null;

  let parsed: RawRating;
  try {
    parsed = JSON.parse(cleaned) as RawRating;
  } catch {
    return null;
  }

  const score = Number(parsed.tea_score);
  if (!Number.isFinite(score)) return null;

  const tea_score = clampScore(score);

  return {
    tea_score,
    /* Temperature is always derived, never trusted from the model, so the
     * label can never contradict the score. */
    temperature: getTier(tea_score).label as TemperatureScale,
    verdict: coerceVerdict(parsed.verdict, fallbackVerdict),
    vibe_tag: coerceVibeTag(parsed.vibe_tag),
    is_safe: true,
  };
}

/** Abort an LLM call that hangs, so a submit cannot stall indefinitely. */
const AI_TIMEOUT_MS = 9_000;

function withTimeout<T>(promise: Promise<T>, ms = AI_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI request timed out')), ms),
    ),
  ]);
}

/* ------------------------------------------------------------------ */
/* Tier 3: deterministic heuristic engine (zero-downtime guarantee)     */
/* ------------------------------------------------------------------ */

const DRAMA_WEIGHTS: ReadonlyArray<readonly [RegExp, number]> = [
  [/\b(cheated|cheating|affair|unfaithful)\b/i, 16],
  [/\b(fired|quit|resigned|laid off)\b/i, 10],
  [/\b(wedding|engaged|divorce|proposal)\b/i, 12],
  [/\b(police|cops|arrested|lawyer|sued)\b/i, 14],
  [/\b(revenge|sabotage|framed|blackmail)\b/i, 13],
  [/\b(secret|nobody knows|never told)\b/i, 9],
  [/\b(boss|manager|hr|coworker)\b/i, 7],
  [/\b(ex|crush|situationship|talking stage)\b/i, 6],
  [/\b(money|salary|raise|stole|stealing)\b/i, 8],
  [/\b(in-laws|mother-in-law|family group chat)\b/i, 7],
  [/\b(caught|exposed|found out|screenshot)\b/i, 8],
];

/**
 * Deterministic scoring. The old version used Math.random() for the verdict and
 * vibe tag, so the same confession produced different output on every render
 * and nothing was reproducible or testable. This hashes the text instead.
 */
function hashText(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

const HEURISTIC_VERDICTS: readonly string[] = [
  'Filed under "things the group chat could never handle." The audacity is documented.',
  'This reads like a season finale nobody was warned about. No notes, mild concern.',
  'Genuinely unhinged decision-making, executed with impressive commitment.',
  'The pettiness is structurally sound. Someone should study it.',
  'Iconic behaviour, questionable judgement, excellent reading material.',
  'You did that. On purpose. And then told the internet about it.',
];

export function calculateHeuristicRating(text: string, category?: Category): TeaRatingResult {
  const seed = hashText(text);
  let score = 42;

  for (const [pattern, weight] of DRAMA_WEIGHTS) {
    if (pattern.test(text)) score += weight;
  }

  /* Length signals effort and detail. */
  if (text.length > 400) score += 8;
  else if (text.length > 200) score += 5;

  /* Emotional punctuation. */
  const exclamations = (text.match(/[!?]/g) ?? []).length;
  score += Math.min(6, exclamations * 2);

  /* Categories that are inherently spicier. */
  if (category === 'relationship' || category === 'petty' || category === 'secret') score += 5;

  /* Small deterministic jitter so scores are not all multiples of the weights. */
  score += (seed % 7) - 3;

  const tea_score = clampScore(Math.max(8, score));

  return {
    tea_score,
    temperature: getTier(tea_score).label as TemperatureScale,
    verdict: HEURISTIC_VERDICTS[seed % HEURISTIC_VERDICTS.length],
    vibe_tag: VIBE_TAGS[seed % VIBE_TAGS.length],
    is_safe: true,
  };
}

/* ------------------------------------------------------------------ */
/* Orchestrator                                                        */
/* ------------------------------------------------------------------ */

export async function rateConfessionWithAI(
  body: string,
  category?: Category,
): Promise<TeaRatingResult> {
  const safety = checkContentSafety(body);
  if (!safety.isSafe) {
    return {
      tea_score: 0,
      temperature: '🥶 Ice Cold',
      verdict: safety.reason ?? 'Rejected by the safety desk.',
      vibe_tag: 'Filtered',
      is_safe: false,
      rejection_reason: safety.reason,
    };
  }

  const desk = category ? CATEGORY_MAP[category]?.label ?? category : 'general';
  const userPrompt = `Desk: ${desk}\n\nConfession:\n"""\n${body}\n"""`;

  /* Tier 1: Groq (fast, generous free tier). */
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const groq = new Groq({ apiKey: groqKey });
      const response = await withTimeout(
        groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 250,
          temperature: 0.75,
          /* Ask for JSON explicitly rather than hoping and regexing. */
          response_format: { type: 'json_object' },
        }),
      );

      const content = response.choices[0]?.message?.content?.trim() ?? '';
      const rating = parseRating(content, 'A truly unforgettable spill.');
      if (rating) return rating;
      console.warn('[AI Rater] Groq returned an unusable payload, trying Gemini.');
    } catch (err) {
      console.warn('[AI Rater] Groq failed:', err instanceof Error ? err.message : err);
    }
  }

  /* Tier 2: Gemini. */
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: { responseMimeType: 'application/json', temperature: 0.75 },
      });

      const result = await withTimeout(model.generateContent(userPrompt));
      const rating = parseRating(result.response.text().trim(), 'An absolute drama masterpiece.');
      if (rating) return rating;
      console.warn('[AI Rater] Gemini returned an unusable payload, using heuristic.');
    } catch (err) {
      console.warn('[AI Rater] Gemini failed:', err instanceof Error ? err.message : err);
    }
  }

  /* Tier 3: always succeeds. */
  return calculateHeuristicRating(body, category);
}
