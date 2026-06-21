export class FunctionUnavailableError extends Error {
  code = "FUNCTION_UNAVAILABLE";

  constructor(message = "This feature is not available right now.") {
    super(message);
    this.name = "FunctionUnavailableError";
  }
}

const looksLikeHtml = (text: string, contentType: string) => {
  const value = text.trim();
  return contentType.includes("text/html") || value.startsWith("<!doctype") || value.startsWith("<html") || value.startsWith("<");
};

export async function readFunctionJson<T>(
  res: Response,
  fallbackMessage = "This feature is not available right now.",
): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();

  let data: any = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (res.status === 404 || looksLikeHtml(text, contentType)) {
        throw new FunctionUnavailableError(fallbackMessage);
      }
      throw new Error(fallbackMessage);
    }
  }

  if (!res.ok || data?.error) {
    if (res.status === 404 || looksLikeHtml(text, contentType)) {
      throw new FunctionUnavailableError(fallbackMessage);
    }
    throw new Error(data?.error || fallbackMessage);
  }

  return data as T;
}

export function isFunctionUnavailableError(error: unknown): error is FunctionUnavailableError {
  return error instanceof FunctionUnavailableError || (error instanceof Error && (error as any).code === "FUNCTION_UNAVAILABLE");
}