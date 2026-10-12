import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { jsonError, jsonOk, safeNextPath } from "@/lib/api";
import {
  REFRESH_COOKIE,
  createSessionTokens,
  setSessionCookies,
  ROLE_HOME,
} from "@/lib/auth/session";
import { verifyRefreshToken } from "@/lib/auth/jwt";
import { cookies } from "next/headers";
import type { Role } from "@/lib/auth/jwt";

type RefreshResult = { ok: true; role: Role } | { ok: false };

/**
 * Verifies the refresh cookie, re-issues both tokens and updates the cookies.
 * DB-side checks: user exists, active, token version matches (revocation).
 */
async function rotateSession(): Promise<RefreshResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(REFRESH_COOKIE())?.value;
  if (!token) return { ok: false };

  const payload = await verifyRefreshToken(token);
  if (!payload) return { ok: false };

  const user = await db.query.users.findFirst({
    where: and(eq(users.id, payload.sub), isNull(users.deletedAt)),
  });
  if (!user || user.status !== "active" || user.tokenVersion !== payload.tv) {
    return { ok: false };
  }

  const tokens = await createSessionTokens({
    sub: user.id,
    role: user.role,
    tv: user.tokenVersion,
  });
  await setSessionCookies(tokens);
  return { ok: true, role: user.role };
}

/** JSON rotation — for API clients handling 401s. */
export async function POST() {
  const result = await rotateSession();
  if (!result.ok) {
    return jsonError("Session expired. Please log in again.", 401);
  }
  return jsonOk({ user: { role: result.role } });
}

/** Navigation fallback — never renders a dead-end JSON page in the browser. */
export async function GET(request: Request) {
  const result = await rotateSession();
  if (!result.ok) {
    return NextResponse.redirect(new URL("/login?reason=expired", request.url));
  }
  const next = safeNextPath(
    new URL(request.url).searchParams.get("next"),
    ROLE_HOME[result.role],
  );
  return NextResponse.redirect(new URL(next, request.url));
}
