import { eq, sql } from "drizzle-orm";
import { db, dbTx } from "@/db";
import { users } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { changePasswordSchema } from "@/lib/validators/auth";
import { verifyPassword, hashPassword } from "@/lib/auth/passwords";
import { createSessionTokens, requireUserAllowingPasswordChange, setSessionCookies } from "@/lib/auth/session";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { isSameOrigin } from "@/lib/security/csrf";

/** Change password for a logged-in user (also used for the forced first-login change). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }

  const user = await requireUserAllowingPasswordChange();

  const limited = rateLimit({ key: `change:${user.id}`, ...RATE_LIMITS.changePassword });
  if (!limited.ok) {
    return jsonError("Too many attempts. Try again later.", 429, {
      retryAfter: limited.retryAfterSeconds,
    });
  }

  const parsed = await parseJsonBody(request, changePasswordSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }

  const row = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { id: true, passwordHash: true, email: true, name: true, role: true },
  });
  if (!row) {
    return jsonError("Account not found", 404);
  }

  const valid = await verifyPassword(parsed.data.currentPassword, row.passwordHash);
  if (!valid) {
    return jsonError("Your current password is incorrect", 400, {
      fieldErrors: { currentPassword: ["Incorrect password"] },
    });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const now = new Date();

  const [updated] = await dbTx.transaction(async (tx) => {
    const result = await tx
      .update(users)
      .set({
        passwordHash,
        mustChangePassword: false,
        tokenVersion: sql`${users.tokenVersion} + 1`,
        updatedAt: now,
      })
      .where(eq(users.id, row.id))
      .returning({ tokenVersion: users.tokenVersion });
    return result;
  });

  if (updated?.tokenVersion === undefined) {
    return jsonError("Could not update password. Try again.", 500);
  }

  // Issue a fresh session so the user isn't logged out by the version bump.
  const tokens = await createSessionTokens({
    sub: row.id,
    role: row.role,
    tv: updated.tokenVersion,
  });
  await setSessionCookies(tokens);

  await logAudit({
    actorId: row.id,
    actorRole: row.role,
    action: "auth.password_changed",
    entityType: "user",
    entityId: row.id,
    summary: `${row.name} changed their password`,
  });

  return jsonOk({ message: "Password updated." });
}
