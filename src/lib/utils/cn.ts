import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Conditional class joining with Tailwind conflict resolution.
 *
 * `clsx` and `tailwind-merge` were already dependencies but imported nowhere,
 * so every component hand-concatenated template strings and later classes did
 * not reliably win. Use this for anything conditional.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
