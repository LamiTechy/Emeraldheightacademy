import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { loginSchema } from "@/lib/validators/auth";
import { DUMMY_HASH, verifyPassword } from "@/lib/auth/passwords";
import {
  createSessionTokens,
  setSessionCookies,
  ROLE_HOME,
} from "@/lib/auth/session";
import { clientIp, rateLimit, rateLimitReset, RATE_LIMITS } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { isSameOrigin } from "@/lib/security/csrf";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }

  const ip = clientIp(request);
  const parsed = await parseJsonBody(request, loginSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }

  const { email, password, honeypot } = parsed.data;

  // Honeypot filled → likely a bot: pretend success, do nothing.
  if (honeypot) {
    return jsonOk({ redirectTo: ROLE_HOME.student });
  }

  const limitKey = `login:${ip}:${email}`;
  const limited = rateLimit({ key: limitKey, ...RATE_LIMITS.login });
  if (!limited.ok) {
    return jsonError(
      `Too many login attempts. Try again in ${limited.retryAfterSeconds} seconds.`,
      429,
      { retryAfter: limited.retryAfterSeconds },
    );
  }

  const user = await db.query.users.findFirst({
    where: and(eq(users.email, email), isNull(users.deletedAt)),
    with: { student: true, tutor: true },
  });

  // Constant-work compare even when the user doesn't exist.
  const validPassword = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !validPassword) {
    await logAudit({
      action: "auth.login_failed",
      entityType: "user",
      entityId: user?.id,
      summary: `Failed login attempt for ${email}`,
      metadata: { email },
    });
    return jsonError("Incorrect email or password", 401);
  }

  if (user.status !== "active") {
    await logAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "auth.login_blocked",
      entityType: "user",
      entityId: user.id,
      summary: `${user.name} tried to log in while ${user.status}`,
    });
    return jsonError(
      user.status === "suspended"
        ? "Your account has been suspended. Please contact the office."
        : "Your account is still pending activation. Please contact the office.",
      403,
    );
  }

  rateLimitReset(limitKey);

  const tokens = await createSessionTokens({
    sub: user.id,
    role: user.role,
    tv: user.tokenVersion,
  });
  await setSessionCookies(tokens);

  await db
    .update(users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await logAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "auth.login",
    entityType: "user",
    entityId: user.id,
    summary: `${user.name} logged in`,
  });

  return jsonOk({
    user: {
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
    redirectTo: user.mustChangePassword ? "/change-password" : ROLE_HOME[user.role],
  });
}
