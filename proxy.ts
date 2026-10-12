import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE_MAX_AGE,
  refreshMaxAgeSeconds,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  type Role,
} from "@/lib/auth/jwt";

const ACCESS_COOKIE = process.env.AUTH_ACCESS_COOKIE ?? "mrsam_access";
const REFRESH_COOKIE = process.env.AUTH_REFRESH_COOKIE ?? "mrsam_refresh";

const ROLE_HOME: Record<Role, string> = {
  student: "/student",
  tutor: "/tutor",
  admin: "/admin",
};

type RotatedTokens = { access: string; refresh: string };

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** Mirror of setSessionCookies() in lib/auth/session.ts (proxy cannot import it). */
function withRotatedCookies(response: NextResponse, tokens: RotatedTokens): NextResponse {
  response.cookies.set(ACCESS_COOKIE, tokens.access, cookieOptions(ACCESS_COOKIE_MAX_AGE));
  response.cookies.set(REFRESH_COOKIE, tokens.refresh, cookieOptions(refreshMaxAgeSeconds()));
  return response;
}

/** Rebuild the outgoing Cookie header with the rotated pair, keeping any others. */
function forwardedCookieHeader(request: NextRequest, tokens: RotatedTokens): string {
  const keep = request.cookies
    .getAll()
    .filter((c) => c.name !== ACCESS_COOKIE && c.name !== REFRESH_COOKIE)
    .map((c) => `${c.name}=${c.value}`);
  return [...keep, `${ACCESS_COOKIE}=${tokens.access}`, `${REFRESH_COOKIE}=${tokens.refresh}`].join("; ");
}

/**
 * Route-level auth guard for the three portals.
 *
 * Only verifies JWT signatures (jose, no DB). When the access cookie is
 * missing or invalid but a valid refresh cookie exists, both tokens are
 * re-issued inside the proxy and forwarded to this request's render — no
 * visible redirect. The DB-side checks (status, token version, forced
 * password change) happen in `requireUser()` inside layouts and actions.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  let session = accessToken ? await verifyAccessToken(accessToken) : null;

  let rotated: RotatedTokens | null = null;

  if (!session) {
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
    const refresh = refreshToken ? await verifyRefreshToken(refreshToken) : null;

    if (!refresh) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("next", pathname + search);
      if (refreshToken) url.searchParams.set("reason", "expired");
      return NextResponse.redirect(url);
    }

    const [access, nextRefresh] = await Promise.all([
      signAccessToken({ sub: refresh.sub, role: refresh.role, tv: refresh.tv }),
      signRefreshToken({ sub: refresh.sub, role: refresh.role, tv: refresh.tv, jti: randomUUID() }),
    ]);
    rotated = { access, refresh: nextRefresh };
    session = { sub: refresh.sub, role: refresh.role, tv: refresh.tv };
  }

  // Wrong role → their own dashboard (admins may view all portals).
  const portalSegment = pathname.split("/")[1];
  if (
    portalSegment === "student" ||
    portalSegment === "tutor" ||
    portalSegment === "admin"
  ) {
    const allowed: Role[] = session.role === "admin" ? ["admin", "student", "tutor"] : [session.role];
    if (!allowed.includes(portalSegment as Role)) {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_HOME[session.role];
      url.search = "";
      const response = NextResponse.redirect(url);
      if (rotated) withRotatedCookies(response, rotated);
      return response;
    }
  }

  if (!rotated) return NextResponse.next();

  // Forward the fresh cookies to this request's render (server components read
  // them via cookies()) and to the browser (Set-Cookie).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("cookie", forwardedCookieHeader(request, rotated));
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  return withRotatedCookies(response, rotated);
}

export const config = {
  matcher: ["/student/:path*", "/tutor/:path*", "/admin/:path*"],
};
