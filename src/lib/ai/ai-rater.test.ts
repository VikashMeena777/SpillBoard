import { describe, expect, it } from 'vitest';
import { calculateHeuristicRating } from './ai-rater';
import { getTier } from '@/lib/constants';

/**
 * The heuristic engine is the tier-3 fallback that guarantees a rating when both
 * LLMs are unavailable — which, in the old build, was every single request,
 * since the rater ran in the browser without API keys.
 */
describe('calculateHeuristicRating', () => {
  const plain = 'I quietly rearranged every book on the shelf by colour and said nothing.';
  const dramatic =
    'I found out my ex cheated, so I got them fired by forwarding the screenshots to their boss.';

  it('is deterministic for the same input', () => {
    /* The old version used Math.random() for verdict and vibe tag, so identical
     * text produced different output on every call and nothing was testable. */
    const a = calculateHeuristicRating(plain);
    const b = calculateHeuristicRating(plain);
    expect(a).toEqual(b);
  });

  it('scores dramatic text above mundane text', () => {
    expect(calculateHeuristicRating(dramatic).tea_score).toBeGreaterThan(
      calculateHeuristicRating(plain).tea_score,
    );
  });

  it('always returns a score within 0-100', () => {
    for (const text of [plain, dramatic, 'a', 'x'.repeat(2000)]) {
      const { tea_score } = calculateHeuristicRating(text);
      expect(tea_score).toBeGreaterThanOrEqual(0);
      expect(tea_score).toBeLessThanOrEqual(100);
    }
  });

  it('derives the temperature label from the score', () => {
    for (const text of [plain, dramatic, 'police arrested me at the wedding, i was blackmailed']) {
      const result = calculateHeuristicRating(text);
      /* Label and score can never contradict each other. */
      expect(result.temperature).toBe(getTier(result.tea_score).label);
    }
  });

  it('marks heuristic ratings as safe with a non-empty verdict', () => {
    const result = calculateHeuristicRating(plain);
    expect(result.is_safe).toBe(true);
    expect(result.verdict.length).toBeGreaterThan(0);
    expect(result.vibe_tag.length).toBeGreaterThan(0);
  });

  it('boosts spicier categories', () => {
    const neutral = calculateHeuristicRating(plain, 'school');
    const spicy = calculateHeuristicRating(plain, 'relationship');
    expect(spicy.tea_score).toBeGreaterThan(neutral.tea_score);
  });

  it('does not throw on empty input', () => {
    expect(() => calculateHeuristicRating('')).not.toThrow();
  });
});
