import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db, dbTx } from "@/db";
import { passwordResets, users } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { hashPassword } from "@/lib/auth/passwords";
import { clientIp, rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { isSameOrigin } from "@/lib/security/csrf";
import { hashResetToken } from "../forgot-password/route";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }

  const ip = clientIp(request);
  const limited = rateLimit({ key: `reset:${ip}`, ...RATE_LIMITS.resetPassword });
  if (!limited.ok) {
    return jsonError("Too many attempts. Try again later.", 429, {
      retryAfter: limited.retryAfterSeconds,
    });
  }

  const parsed = await parseJsonBody(request, resetPasswordSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }

  const { token, password } = parsed.data;
  const tokenHash = hashResetToken(token);

  const reset = await db.query.passwordResets.findFirst({
    where: and(
      eq(passwordResets.tokenHash, tokenHash),
      isNull(passwordResets.usedAt),
      gt(passwordResets.expiresAt, new Date()),
    ),
    with: { user: true },
  });

  if (!reset || !reset.user || reset.user.deletedAt || reset.user.status !== "active") {
    return jsonError(
      "This reset link is invalid or has expired. Request a new one.",
      400,
    );
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();

  await dbTx.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        passwordHash,
        mustChangePassword: false,
        // Revokes every outstanding JWT for this user.
        tokenVersion: sql`${users.tokenVersion} + 1`,
        updatedAt: now,
      })
      .where(eq(users.id, reset.user!.id));

    await tx
      .update(passwordResets)
      .set({ usedAt: now })
      .where(eq(passwordResets.id, reset.id));

    // Burn any other outstanding reset links.
    await tx
      .update(passwordResets)
      .set({ usedAt: now })
      .where(and(eq(passwordResets.userId, reset.user!.id), isNull(passwordResets.usedAt)));
  });

  await logAudit({
    actorId: reset.user.id,
    actorRole: reset.user.role,
    action: "auth.password_reset_completed",
    entityType: "user",
    entityId: reset.user.id,
    summary: `Password reset completed for ${reset.user.email}`,
  });

  return jsonOk({ message: "Password updated. You can now log in." });
}
