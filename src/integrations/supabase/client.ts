import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function getEnvVar(name: string, viteAliases: string[]): string {
  // Client-side: Vite replaces import.meta.env.VITE_* at build time
  for (const alias of viteAliases) {
    const val = import.meta.env[alias];
    if (val) return val;
  }
  // SSR / server-side: read from process.env
  if (typeof process !== 'undefined' && process.env) {
    const val = process.env[name];
    if (val) return val;
  }
  throw new Error(
    `Missing environment variable: ${name}. ` +
    `Define VITE_${name} (or ${viteAliases.join(' / ')}) in your .env file.`
  );
}

function createSupabaseClient() {
  const SUPABASE_URL = getEnvVar('SUPABASE_URL', [
    'VITE_SUPABASE_URL',
  ]);

  const SUPABASE_PUBLISHABLE_KEY = getEnvVar('SUPABASE_PUBLISHABLE_KEY', [
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'VITE_SUPABASE_ANON_KEY',
  ]);

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});

