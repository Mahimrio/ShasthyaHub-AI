import { createBrowserClient } from '@supabase/ssr';

function getEnv(name: string): string {
  const val = process.env[name];
  if (val) return val;
  // Return dummy values during build/prerender so static generation doesn't fail
  return `missing-${name}`;
}

export function createClient() {
  return createBrowserClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  );
}
