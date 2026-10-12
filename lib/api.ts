import { z } from "zod";

export function jsonError(
  message: string,
  status = 400,
  extras?: Record<string, unknown>,
): Response {
  return Response.json({ ok: false, error: message, ...extras }, { status });
}

export function jsonOk<T extends Record<string, unknown>>(
  data: T,
  init?: ResponseInit,
): Response {
  return Response.json({ ok: true, ...data }, init);
}

export type ParseResult<T> =
  | { data: T }
  | { error: string; status: number; fieldErrors?: Record<string, string[]> };

export async function parseJsonBody<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
): Promise<ParseResult<z.infer<Schema>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: "Invalid JSON body", status: 400 };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues;
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of issues) {
      const key = issue.path.join(".") || "_";
      (fieldErrors[key] ??= []).push(issue.message);
    }
    const first = issues[0];
    return {
      error: first ? `${first.message}` : "Invalid input",
      status: 422,
      fieldErrors,
    };
  }

  return { data: parsed.data };
}

/** Only allows safe internal redirect paths (no //host, no external URLs). */
export function safeNextPath(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

/** Postgres unique_violation (SQLSTATE 23505). */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "23505"
  );
}
