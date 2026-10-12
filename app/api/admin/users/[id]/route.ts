import { and, eq, isNull, sql } from "drizzle-orm";
import { db, dbTx } from "@/db";
import { students, tutors, users } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody, isUniqueViolation } from "@/lib/api";
import { updateUserSchema } from "@/lib/validators/admin";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

/** Update profile fields of any user. Suspending revokes outstanding sessions. */
export async function PATCH(
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

  const parsed = await parseJsonBody(request, updateUserSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const data = parsed.data;

  const existing = await db.query.users.findFirst({
    where: and(eq(users.id, id), isNull(users.deletedAt)),
    columns: { id: true, name: true, email: true, status: true, role: true },
    with: { student: { columns: { id: true } }, tutor: { columns: { id: true } } },
  });
  if (!existing) {
    return jsonError("User not found", 404);
  }

  const willSuspend = data.status === "suspended" && existing.status !== "suspended";

  try {
    await dbTx.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          name: data.name,
          email: data.email,
          phone: data.phone,
          status: data.status,
          mustChangePassword: data.mustChangePassword,
          ...(willSuspend ? { tokenVersion: sql`${users.tokenVersion} + 1` } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, id));

      if (
        existing.student &&
        (data.educationLevel !== undefined ||
          data.gender !== undefined ||
          data.school !== undefined ||
          data.guardianName !== undefined ||
          data.guardianPhone !== undefined)
      ) {
        await tx
          .update(students)
          .set({
            educationLevel: data.educationLevel,
            gender: data.gender,
            school: data.school,
            guardianName: data.guardianName,
            guardianPhone: data.guardianPhone,
            updatedAt: new Date(),
          })
          .where(eq(students.id, existing.student.id));
      }

      if (
        existing.tutor &&
        (data.bio !== undefined || data.qualifications !== undefined)
      ) {
        await tx
          .update(tutors)
          .set({
            bio: data.bio,
            qualifications: data.qualifications,
            updatedAt: new Date(),
          })
          .where(eq(tutors.id, existing.tutor.id));
      }
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return jsonError("A user with that email already exists", 409, {
        fieldErrors: { email: ["Email already in use"] },
      });
    }
    throw error;
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "admin.user_updated",
    entityType: "user",
    entityId: id,
    summary: `Updated account ${existing.email}`,
    metadata: { changes: data, suspended: willSuspend },
  });

  return jsonOk({ id });
}

/** Soft-delete a user (revokes sessions). Admins cannot delete themselves. */
export async function DELETE(
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
  if (id === admin.id) {
    return jsonError("You cannot delete your own account", 400);
  }

  const existing = await db.query.users.findFirst({
    where: and(eq(users.id, id), isNull(users.deletedAt)),
    columns: { id: true, email: true, name: true, role: true },
  });
  if (!existing) {
    return jsonError("User not found", 404);
  }

  await dbTx.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        deletedAt: new Date(),
        status: "suspended",
        tokenVersion: sql`${users.tokenVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  });

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "admin.user_deleted",
    entityType: "user",
    entityId: id,
    summary: `Deleted account ${existing.email}`,
    metadata: { role: existing.role },
  });

  return jsonOk({ id });
}
