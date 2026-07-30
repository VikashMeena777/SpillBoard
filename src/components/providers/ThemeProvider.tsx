'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

/**
 * Wraps next-themes (already a dependency, previously unused — the old build
 * hardcoded `className="dark"` on <html> with no way to switch).
 *
 * `attribute="class"` toggles the `.dark` block in globals.css, which swaps the
 * paper/ink CSS variables. Default is the paper edition.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      themes={['light', 'dark']}
    >
      {children}
    </NextThemeProvider>
  );
}
