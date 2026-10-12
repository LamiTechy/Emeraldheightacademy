import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { batches, enrollments, students } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { createEnrollmentSchema } from "@/lib/validators/admin";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

/**
 * Enroll a student into a batch.
 * Revives a previously dropped/completed enrollment instead of duplicating it.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const parsed = await parseJsonBody(request, createEnrollmentSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const data = parsed.data;

  const student = await db.query.students.findFirst({
    where: eq(students.userId, data.studentUserId),
    columns: { id: true, studentId: true },
    with: { user: { columns: { id: true, name: true, status: true, role: true } } },
  });
  if (!student || student.user.role !== "student") {
    return jsonError("Select an existing student", 422, {
      fieldErrors: { studentUserId: ["Not a student account"] },
    });
  }
  if (student.user.status !== "active") {
    return jsonError("This student's account is not active", 422, {
      fieldErrors: { studentUserId: ["Account is not active"] },
    });
  }

  const batch = await db.query.batches.findFirst({
    where: eq(batches.id, data.batchId),
    columns: { id: true, code: true, capacity: true, status: true },
  });
  if (!batch) return jsonError("Select an existing batch", 422);

  if (batch.status === "completed" || batch.status === "cancelled") {
    return jsonError("That batch is no longer accepting enrollments", 422, {
      fieldErrors: { batchId: ["Batch is completed or cancelled"] },
    });
  }

  const existing = await db.query.enrollments.findFirst({
    where: and(eq(enrollments.studentId, student.id), eq(enrollments.batchId, batch.id)),
    columns: { id: true, status: true },
  });

  if (existing?.status === "active") {
    return jsonError("This student is already enrolled in that batch", 409, {
      fieldErrors: { studentUserId: ["Already enrolled"] },
    });
  }

  if (existing) {
    // Revive the previous record (dropped / completed / pending / waitlisted).
    await db
      .update(enrollments)
      .set({
        status: "active",
        droppedAt: null,
        completedAt: null,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(enrollments.id, existing.id));

    await logAudit({
      actorId: admin.id,
      actorRole: "admin",
      action: "admin.enrollment_revived",
      entityType: "enrollment",
      entityId: existing.id,
      summary: `Reactivated ${student.user.name} in batch ${batch.code}`,
    });

    return jsonOk({ id: existing.id, revived: true });
  }

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(enrollments)
    .where(and(eq(enrollments.batchId, batch.id), eq(enrollments.status, "active")));
  if ((n ?? 0) >= batch.capacity) {
    return jsonError("That batch is already at capacity", 422, {
      fieldErrors: { batchId: ["Batch is full"] },
    });
  }

  const [row] = await db
    .insert(enrollments)
    .values({
      studentId: student.id,
      batchId: batch.id,
      status: "active",
      notes: data.notes ?? null,
    })
    .returning({ id: enrollments.id });

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "admin.enrollment_created",
    entityType: "enrollment",
    entityId: row!.id,
    summary: `Enrolled ${student.user.name} (${student.studentId}) in batch ${batch.code}`,
  });

  return jsonOk({ id: row!.id });
}
