import "server-only";
import { jsonError } from "@/lib/api";
import { getCurrentUser, type AuthUser } from "@/lib/auth/session";
import type { Role } from "@/lib/auth/jwt";

/**
 * Returns the authenticated user with the required role, or a ready-to-return
 * 401 JSON response. Usage:
 *   const guard = await requireApiRole("admin");
 *   if (guard.response) return guard.response;
 *   const user = guard.user;
 */
export async function requireApiRole(
  role: Role,
): Promise<{ user: AuthUser; response?: never } | { user?: never; response: Response }> {
  const user = await getCurrentUser();
  if (!user || user.role !== role) {
    return { response: jsonError("Unauthorized", 401) };
  }
  return { user };
}

/** Any authenticated user (no specific role required). */
export async function requireApiUser(): Promise<
  { user: AuthUser; response?: never } | { user?: never; response: Response }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { response: jsonError("Unauthorized", 401) };
  }
  return { user };
}
