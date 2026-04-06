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
