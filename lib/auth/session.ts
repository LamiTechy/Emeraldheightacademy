import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { randomUUID } from "node:crypto";
import {
  ACCESS_COOKIE_MAX_AGE,
  refreshMaxAgeSeconds,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  type Role,
  type SessionPayload,
} from "./jwt";

export const ACCESS_COOKIE = () => process.env.AUTH_ACCESS_COOKIE ?? "mrsam_access";
export const REFRESH_COOKIE = () => process.env.AUTH_REFRESH_COOKIE ?? "mrsam_refresh";

function secureFlag(): boolean {
  // Allow plain HTTP on localhost in development.
  if (process.env.NODE_ENV !== "production") return false;
  return true;
}

export type AuthUser = {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  status: "active" | "suspended" | "pending";
  mustChangePassword: boolean;
  /** present for role=student */
  studentId: string | null;
  studentRowId: string | null;
  /** present for role=tutor */
  tutorId: string | null;
  tutorRowId: string | null;
  /** admin id of impersonator, when viewing-as */
  impersonatedBy: string | null;
};

export async function createSessionTokens(payload: SessionPayload) {
  const refreshJti = randomUUID();
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken({ sub: payload.sub, role: payload.role, tv: payload.tv, jti: refreshJti }),
  ]);
  return { accessToken, refreshToken };
}

export async function setSessionCookies(tokens: {
  accessToken: string;
  refreshToken: string;
}) {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE(), tokens.accessToken, {
    httpOnly: true,
    secure: secureFlag(),
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_COOKIE_MAX_AGE,
  });
  cookieStore.set(REFRESH_COOKIE(), tokens.refreshToken, {
    httpOnly: true,
    secure: secureFlag(),
    sameSite: "lax",
    path: "/",
    maxAge: refreshMaxAgeSeconds(),
  });
}

export async function clearSessionCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE());
  cookieStore.delete(REFRESH_COOKIE());
}

/** Verifies the access cookie only (no DB hit). Deduped per request. */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE())?.value;
  if (!token) return null;
  return verifyAccessToken(token);
});

/** Loads the authenticated user's DB row (status, mustChangePassword, profile ids). Deduped per request. */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const row = await db.query.users.findFirst({
    where: and(eq(users.id, session.sub), isNull(users.deletedAt)),
    with: {
      student: true,
      tutor: true,
    },
  });
  if (!row || row.status !== "active") return null;
  // Revoked tokens (password changed, account suspended) are rejected.
  if (row.tokenVersion !== session.tv) return null;

  return {
    id: row.id,
    role: row.role,
    name: row.name,
    email: row.email,
    phone: row.phone,
    avatarUrl: row.avatarUrl,
    status: row.status,
    mustChangePassword: row.mustChangePassword,
    studentId: row.student?.studentId ?? null,
    studentRowId: row.student?.id ?? null,
    tutorId: row.tutor?.tutorId ?? null,
    tutorRowId: row.tutor?.id ?? null,
    impersonatedBy: session.imp ?? null,
  };
});

export const ROLE_HOME: Record<Role, string> = {
  student: "/student",
  tutor: "/tutor",
  admin: "/admin",
};

/**
 * Server-side guard for pages & server actions.
 * Redirects anonymous users to /login, suspended users out, and enforces
 * forced password change. Never trusts client-sent role/user id.
 */
export async function requireUser(role?: Role): Promise<AuthUser> {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getCurrentUser();
  if (!user) {
    await clearSessionCookies();
    redirect("/login?reason=expired");
  }

  if (role && user.role !== role) {
    redirect(ROLE_HOME[user.role]);
  }

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  return user;
}

/** Like requireUser, but allows the forced-password-change page itself. */
export async function requireUserAllowingPasswordChange(role?: Role): Promise<AuthUser> {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getCurrentUser();
  if (!user) {
    await clearSessionCookies();
    redirect("/login?reason=expired");
  }
  if (role && user.role !== role) redirect(ROLE_HOME[user.role]);
  return user;
}
