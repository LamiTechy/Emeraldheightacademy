export type ApiResult<T = Record<string, unknown>> = {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Client-side helper for the app's own JSON APIs.
 * Never throws — resolves with { ok:false, error } on network/server failure.
 */
export async function apiRequest<T extends Record<string, unknown> = Record<string, unknown>>(
  path: string,
  options?: { method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; body?: unknown },
): Promise<ApiResult<T>> {
  try {
    const method = options?.method ?? "POST";
    const res = await fetch(path, {
      method,
      headers: options?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    let json: Record<string, unknown> | null = null;
    try {
      json = (await res.json()) as Record<string, unknown>;
    } catch {
      json = null;
    }

    if (json && typeof json === "object") {
      if (json.ok) {
        return { ok: true, data: json as T, fieldErrors: undefined };
      }
      return {
        ok: false,
        error: typeof json.error === "string" ? json.error : `Request failed (${res.status})`,
        fieldErrors: (json.fieldErrors as Record<string, string[]> | undefined) ?? undefined,
      };
    }
    return { ok: false, error: `Request failed (${res.status})` };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}
