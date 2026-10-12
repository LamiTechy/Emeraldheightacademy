import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

export type Role = "student" | "tutor" | "admin";

export type SessionPayload = {
  /** user id */
  sub: string;
  role: Role;
  /** token version — must match users.token_version or the JWT is revoked */
  tv: number;
  /** admin id of the impersonator, when viewing-as */
  imp?: string;
};

export type RefreshPayload = {
  sub: string;
  role: Role;
  tv: number;
  jti: string;
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "Missing environment variable JWT_SECRET. Copy .env.example to .env.local and set a long random secret.",
    );
  }
  return encoder.encode(secret);
}

export function refreshTtlDays(): number {
  const raw = Number(process.env.JWT_REFRESH_TTL_DAYS ?? "14");
  return Number.isFinite(raw) && raw > 0 ? raw : 14;
}

/** Refresh cookie max-age in seconds (matches the refresh JWT's lifetime). */
export function refreshMaxAgeSeconds(): number {
  return refreshTtlDays() * 24 * 60 * 60;
}

/**
 * Access cookie max-age in seconds. The access JWT itself has NO expiry —
 * this only controls when the browser drops the cookie, which is what triggers
 * the silent in-proxy refresh. Kept shorter than the refresh lifetime so an
 * active user's session keeps sliding forward indefinitely.
 */
export const ACCESS_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

/**
 * The access token deliberately has no `exp` claim: sessions are long-lived
 * and revoked centrally via `users.token_version` (password change,
 * suspension), not by token expiry.
 */
export async function signAccessToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, tv: payload.tv, ...(payload.imp ? { imp: payload.imp } : {}) })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setIssuer("mrsam-portal")
    .sign(getSecret());
}

export async function signRefreshToken(payload: RefreshPayload): Promise<string> {
  return new SignJWT({ role: payload.role, tv: payload.tv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setJti(payload.jti)
    .setIssuedAt()
    .setIssuer("mrsam-portal")
    .setExpirationTime(`${refreshTtlDays()}d`)
    .sign(getSecret());
}

export async function verifyAccessToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { issuer: "mrsam-portal" });
    if (!payload.sub || typeof payload.role !== "string" || typeof payload.tv !== "number") {
      return null;
    }
    return {
      sub: payload.sub,
      role: payload.role as Role,
      tv: payload.tv,
      ...(typeof payload.imp === "string" ? { imp: payload.imp } : {}),
    };
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { issuer: "mrsam-portal" });
    if (
      !payload.sub ||
      typeof payload.role !== "string" ||
      typeof payload.jti !== "string" ||
      typeof payload.tv !== "number"
    ) {
      return null;
    }
    return { sub: payload.sub, role: payload.role as Role, tv: payload.tv, jti: payload.jti };
  } catch {
    return null;
  }
}
