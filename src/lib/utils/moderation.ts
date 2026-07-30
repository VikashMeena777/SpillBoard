import { LIMITS } from '@/lib/constants';

export interface ModerationResult {
  isSafe: boolean;
  reason?: string;
}

/**
 * Contact-detail detection.
 *
 * The previous PHONE_REGEX was `(...)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b`
 * — an unparenthesised top-level `|` plus a loose 3-3-4 branch with optional
 * separators. That matched any 10 consecutive digits and also plain prose like
 * "1234 567 8901", so ordinary numbers in a confession were rejected as phone
 * numbers.
 *
 * These patterns are anchored on word boundaries and require either an explicit
 * country code / grouping punctuation or a standalone 10-digit run, which is a
 * far better signal-to-noise tradeoff.
 */
const PHONE_PATTERNS: readonly RegExp[] = [
  /\+\d{1,3}[-.\s]?\d{3,5}[-.\s]?\d{4,6}\b/, // +91 98765 43210
  /* No leading \b here: a word boundary cannot exist between a space and "(",
   * so anchoring on it made this pattern never match "(555) 123-4567". */
  /\(\d{3}\)[-.\s]?\d{3}[-.\s]?\d{4}\b/, // (555) 123-4567
  /\b\d{3}[-.]\d{3}[-.]\d{4}\b/, // 555-123-4567
  /(?<!\d)\d{10}(?!\d)/, // 5551234567
];

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

/**
 * Social handles are just as identifying as an email.
 *
 * Two separate patterns rather than one alternation. A platform name only counts
 * as doxxing when a connector actually links it to a handle ("insta is x",
 * "snap: x") — requiring the connector is what keeps ordinary prose like
 * "discord was chaos that night" from being rejected.
 */
const SOCIAL_PATTERNS: readonly RegExp[] = [
  /\b(?:insta(?:gram)?|snap(?:chat)?|tele(?:gram)?|whatsapp|discord|twitter|tiktok)\b\s*(?:is|id|handle|username|[:=])\s*@?[a-z0-9._]{3,}/i,
  /(?:^|\s)@[a-z0-9._]{4,}/i,
];

const ADDRESS_REGEX =
  /\b(street|road|avenue|colony|nagar|apartment|flat no|house no|sector|zip|pincode|postcode)\b/i;

/** Phrases that indicate genuine harm rather than gossip. */
const FORBIDDEN_PHRASES: readonly string[] = [
  'kill yourself',
  'kys',
  'bomb threat',
  'shoot up the',
  'doxxed',
  'address is',
  'phone number is',
  'child p',
  'revenge porn',
];

/** URLs let someone route around every other check. */
const URL_REGEX = /\b(?:https?:\/\/|www\.)\S+/i;

export function checkContentSafety(text: string): ModerationResult {
  const trimmed = (text ?? '').trim();

  if (trimmed.length < LIMITS.bodyMin) {
    return {
      isSafe: false,
      /* Message is generated from LIMITS so it can no longer drift from the
       * enforced value — the old copy said 500 while rejecting at 600. */
      reason: `Your spill needs at least ${LIMITS.bodyMin} characters. Give us something to work with.`,
    };
  }

  if (trimmed.length > LIMITS.bodyMax) {
    return {
      isSafe: false,
      reason: `Your spill is ${trimmed.length} characters. Trim it to ${LIMITS.bodyMax} or fewer.`,
    };
  }

  if (PHONE_PATTERNS.some((re) => re.test(trimmed))) {
    return {
      isSafe: false,
      reason: 'Remove the phone number. Contact details are never allowed.',
    };
  }

  if (EMAIL_REGEX.test(trimmed)) {
    return {
      isSafe: false,
      reason: 'Remove the email address. Contact details are never allowed.',
    };
  }

  if (SOCIAL_PATTERNS.some((re) => re.test(trimmed))) {
    return {
      isSafe: false,
      reason: 'Remove the social handle. It identifies someone.',
    };
  }

  if (URL_REGEX.test(trimmed)) {
    return {
      isSafe: false,
      reason: 'Links are not allowed in spills.',
    };
  }

  if (ADDRESS_REGEX.test(trimmed) && /\d/.test(trimmed)) {
    return {
      isSafe: false,
      reason: 'That reads like a home address. Publishing one is off limits.',
    };
  }

  const lower = trimmed.toLowerCase();
  for (const phrase of FORBIDDEN_PHRASES) {
    if (lower.includes(phrase)) {
      return {
        isSafe: false,
        reason: 'This crosses the line from gossip into harm. Rewrite it.',
      };
    }
  }

  return { isSafe: true };
}

/**
 * Strip zero-width and control characters used to smuggle content past
 * moderation, and collapse runaway whitespace.
 */
export function sanitizeText(text: string): string {
  return (text ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
