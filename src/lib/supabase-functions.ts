const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

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
  const url = isDev
    ? `/functions/v1/${functionName}`
    : `${SUPABASE_URL}/functions/v1/${functionName}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  if (!isDev) {
    headers["apikey"] = SUPABASE_ANON_KEY;
  }

  return fetch(url, {
    method,
    headers,
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  });
}
