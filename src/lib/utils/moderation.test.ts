import { describe, expect, it } from 'vitest';
import { checkContentSafety, sanitizeText } from './moderation';
import { LIMITS } from '@/lib/constants';

/** Filler that comfortably clears the minimum length. */
const ok = 'I replaced my roommate expensive matcha with pure spirulina powder for three weeks.';

describe('checkContentSafety', () => {
  it('accepts an ordinary confession', () => {
    expect(checkContentSafety(ok).isSafe).toBe(true);
  });

  describe('length', () => {
    it('rejects text below the minimum', () => {
      const result = checkContentSafety('too short');
      expect(result.isSafe).toBe(false);
      expect(result.reason).toContain(String(LIMITS.bodyMin));
    });

    it('rejects text above the maximum', () => {
      const result = checkContentSafety('a'.repeat(LIMITS.bodyMax + 1));
      expect(result.isSafe).toBe(false);
      /* The old message said "500" while rejecting at 600. */
      expect(result.reason).toContain(String(LIMITS.bodyMax));
    });

    it('accepts text exactly at the maximum', () => {
      expect(checkContentSafety('a'.repeat(LIMITS.bodyMax)).isSafe).toBe(true);
    });

    it('measures length after trimming', () => {
      expect(checkContentSafety(`   ${ok}   `).isSafe).toBe(true);
    });
  });

  describe('contact details', () => {
    it.each([
      ['+91 98765 43210'],
      ['(555) 123-4567'],
      ['555-123-4567'],
      ['5551234567'],
    ])('rejects the phone number %s', (phone) => {
      expect(checkContentSafety(`${ok} Call me on ${phone} about it.`).isSafe).toBe(false);
    });

    it('rejects emails', () => {
      expect(checkContentSafety(`${ok} Reach me at someone@example.com now.`).isSafe).toBe(false);
    });

    it('rejects social handles', () => {
      expect(checkContentSafety(`${ok} My insta is coolperson22 btw.`).isSafe).toBe(false);
    });

    it('rejects links', () => {
      expect(checkContentSafety(`${ok} Proof at https://example.com/x here.`).isSafe).toBe(false);
    });

    /*
     * Regression: the previous PHONE_REGEX had an unparenthesised top-level `|`
     * and a loose 3-3-4 branch, so any 10 consecutive digits — and ordinary
     * spaced numbers — tripped the phone filter.
     */
    it('does not mistake a year range for a phone number', () => {
      expect(checkContentSafety(`${ok} This ran from 2019 to 2024 by the way.`).isSafe).toBe(true);
    });

    it('does not mistake a price for a phone number', () => {
      expect(checkContentSafety(`${ok} It cost me 4500 rupees in total.`).isSafe).toBe(true);
    });
  });

  describe('harm', () => {
    it('rejects violent phrases', () => {
      expect(checkContentSafety(`${ok} Honestly kill yourself.`).isSafe).toBe(false);
    });

    it('rejects a residential address', () => {
      expect(checkContentSafety(`${ok} Flat no 42 on that street.`).isSafe).toBe(false);
    });

    it('allows the word "street" with no numbers', () => {
      expect(checkContentSafety('We argued loudly on the street about the matcha tin.').isSafe).toBe(
        true,
      );
    });
  });

  it('handles empty and whitespace input without throwing', () => {
    expect(checkContentSafety('').isSafe).toBe(false);
    expect(checkContentSafety('    ').isSafe).toBe(false);
  });
});

describe('sanitizeText', () => {
  it('strips zero-width characters used to evade filters', () => {
    expect(sanitizeText('he\u200Bllo')).toBe('hello');
  });

  it('strips control characters', () => {
    expect(sanitizeText('a\u0000b')).toBe('ab');
  });

  it('collapses runs of spaces and blank lines', () => {
    expect(sanitizeText('a    b')).toBe('a b');
    expect(sanitizeText('a\n\n\n\n\nb')).toBe('a\n\nb');
  });

  it('trims and tolerates empty input', () => {
    expect(sanitizeText('  padded  ')).toBe('padded');
    expect(sanitizeText('')).toBe('');
  });
});
