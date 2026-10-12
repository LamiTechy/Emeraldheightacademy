import { eq } from "drizzle-orm";
import { db } from "@/db";
import { enrollments } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { updateEnrollmentSchema } from "@/lib/validators/admin";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

function statusTimestamps(status: "pending" | "active" | "waitlisted" | "completed" | "dropped") {
  if (status === "dropped") return { droppedAt: new Date(), completedAt: null };
  if (status === "completed") return { completedAt: new Date(), droppedAt: null };
  return { droppedAt: null, completedAt: null };
}

/** Change enrollment status (active / waitlisted / completed / dropped). */
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
    return jsonError("Invalid enrollment id", 400);
  }

  const parsed = await parseJsonBody(request, updateEnrollmentSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const data = parsed.data;

  const existing = await db.query.enrollments.findFirst({
    where: eq(enrollments.id, id),
    columns: { id: true, status: true },
  });
  if (!existing) return jsonError("Enrollment not found", 404);

  await db
    .update(enrollments)
    .set({
      status: data.status,
      notes: data.notes,
      ...statusTimestamps(data.status),
      updatedAt: new Date(),
    })
    .where(eq(enrollments.id, id));

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "admin.enrollment_status_changed",
    entityType: "enrollment",
    entityId: id,
    summary: `Enrollment ${existing.status} → ${data.status}`,
  });

  return jsonOk({ id });
}

/** Remove an enrollment record entirely. */
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
    return jsonError("Invalid enrollment id", 400);
  }

  const existing = await db.query.enrollments.findFirst({
    where: eq(enrollments.id, id),
    columns: { id: true, status: true },
  });
  if (!existing) return jsonError("Enrollment not found", 404);

  await db.delete(enrollments).where(eq(enrollments.id, id));

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "admin.enrollment_removed",
    entityType: "enrollment",
    entityId: id,
    summary: `Removed enrollment (${existing.status})`,
  });

  return jsonOk({ id });
}
