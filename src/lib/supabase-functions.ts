import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export async function getToken(): Promise<string> {
  let { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    const { data } = await supabase.auth.refreshSession();
    session = data.session;
  }
  return session?.access_token ?? "";
}

export async function callEdgeFunction(
  functionName: string,
  options?: {
    method?: "GET" | "POST" | "DELETE";
    body?: object;
    token?: string;
  },
): Promise<Response> {
  const method = options?.method ?? (options?.body ? "POST" : "GET");
  const isDev = import.meta.env.DEV;
  const isLocalHost = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const localUrl = `/functions/v1/${functionName}`;
  const remoteUrl = `${SUPABASE_URL}/functions/v1/${functionName}`;
  const useLocal = isDev || isLocalHost;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!useLocal) {
    headers["apikey"] = SUPABASE_ANON_KEY;
  }

  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  };

  if (useLocal) {
    try {
      return await fetch(localUrl, fetchOptions);
    } catch {
      return fetch(remoteUrl, fetchOptions);
    }
  }

  return fetch(remoteUrl, fetchOptions);
}

/** Parse JSON from a fetch Response without throwing on empty body (avoids "Unexpected end of JSON input"). */
export async function readResponseJson<T = Record<string, unknown>>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return { error: `Invalid response (${res.status}): ${text.slice(0, 200)}` } as T;
  }
}
