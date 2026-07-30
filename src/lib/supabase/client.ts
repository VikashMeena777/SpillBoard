import { createBrowserClient } from '@supabase/ssr';

/**
 * Whether Supabase credentials are actually configured.
 *
 * The old client silently substituted 'https://placeholder.supabase.co' and
 * 'placeholder-key', so a misconfigured deploy produced confusing network
 * errors instead of a clear "not configured" signal. Callers check this first
 * and skip the round trip entirely.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && url.startsWith('http') && !url.includes('placeholder'));
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  return createBrowserClient(url, key);
}
