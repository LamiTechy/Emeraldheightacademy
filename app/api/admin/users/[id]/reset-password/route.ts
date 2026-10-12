import { and, eq, isNull, sql } from "drizzle-orm";
import { db, dbTx } from "@/db";
import { users } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { setUserPasswordSchema } from "@/lib/validators/admin";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/passwords";
import { z } from "zod";

/**
 * Admin sets a new temporary password for a user.
 * Revokes all their sessions and forces a password change on next login.
 */
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) {
    return jsonError("Invalid user id", 400);
  }

  const parsed = await parseJsonBody(request, setUserPasswordSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }

  const existing = await db.query.users.findFirst({
    where: and(eq(users.id, id), isNull(users.deletedAt)),
    columns: { id: true, email: true, name: true },
  });
  if (!existing) {
    return jsonError("User not found", 404);
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await dbTx.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        passwordHash,
        mustChangePassword: true,
        tokenVersion: sql`${users.tokenVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  });

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "admin.user_password_reset",
    entityType: "user",
    entityId: id,
    summary: `Reset password for ${existing.email}`,
  });

  return jsonOk({ id, message: "Password updated. Share it with the user securely." });
}
