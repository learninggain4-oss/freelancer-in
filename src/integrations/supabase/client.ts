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

// Override supabase.functions.invoke to route to the local Express server
// instead of the Supabase Edge Functions URL. This way all existing calls
// in the codebase automatically hit our Express server via Vite proxy (dev)
// or directly (production).
const _originalInvoke = supabase.functions.invoke.bind(supabase.functions);
(supabase.functions as any).invoke = async function <T = unknown>(
  functionName: string,
  options?: { body?: unknown; headers?: Record<string, string> }
): Promise<{ data: T | null; error: Error | null }> {
  try {
    let token: string | undefined;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token ?? undefined;
    } catch { /* proceed without token */ }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/functions/v1/${functionName}`, {
      method: 'POST',
      headers,
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const text = await res.text();
    const data: T = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const msg = (data as any)?.error || `Request failed with status ${res.status}`;
      return { data: null, error: new Error(msg) };
    }

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
};
