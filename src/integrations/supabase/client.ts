import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
});

// Patch supabase.functions.invoke to use relative URLs so requests go through
// the Vite proxy (/functions/v1 → localhost:3001) instead of directly to Supabase.
// This ensures all edge-function logic runs on our local Express server.
const _originalInvoke = supabase.functions.invoke.bind(supabase.functions);
supabase.functions.invoke = async (functionName: string, options?: any) => {
  try {
    const session = (await supabase.auth.getSession()).data.session;
    const res = await fetch(`/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? ''}`,
        ...(options?.headers ?? {}),
      },
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) {
      return { data: null, error: { message: data?.error ?? `HTTP ${res.status}` } };
    }
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: { message: err?.message ?? 'Network error' } };
  }
};
