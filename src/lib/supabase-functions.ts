import { supabase } from "@/integrations/supabase/client";

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
  // Use relative URL so Vite proxy (dev) and Express server (prod) both handle it correctly
  const url = `/functions/v1/${functionName}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  return fetch(url, {
    method,
    headers,
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  });
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
