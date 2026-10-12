import { and, eq, inArray, sql } from "drizzle-orm";
import { db, dbTx } from "@/db";
import { batches, enrollments, tutorAssignments } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody, isUniqueViolation } from "@/lib/api";
import { updateBatchSchema } from "@/lib/validators/admin";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import { normalizeTime } from "@/lib/format";
import { z } from "zod";

/** Update a batch; tutorIds (when provided) replaces the whole assignment set. */
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
    return jsonError("Invalid batch id", 400);
  }

  const parsed = await parseJsonBody(request, updateBatchSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const data = parsed.data;

  const existing = await db.query.batches.findFirst({
    where: eq(batches.id, id),
    columns: { id: true, code: true },
  });
  if (!existing) return jsonError("Batch not found", 404);

  try {
    await dbTx.transaction(async (tx) => {
      await tx
        .update(batches)
        .set({
          courseId: data.courseId,
          name: data.name,
          code: data.code?.toUpperCase(),
          daysOfWeek: data.daysOfWeek,
          startTime: data.startTime ? normalizeTime(data.startTime) : undefined,
          endTime: data.endTime ? normalizeTime(data.endTime) : undefined,
          mode: data.mode,
          room: data.room,
          meetingUrl: data.meetingUrl,
          capacity: data.capacity,
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
          updatedAt: new Date(),
        })
        .where(eq(batches.id, id));

      if (data.tutorIds !== undefined) {
        await tx.delete(tutorAssignments).where(eq(tutorAssignments.batchId, id));
        if (data.tutorIds.length > 0) {
          await tx.insert(tutorAssignments).values(
            data.tutorIds.map((tutorId) => ({ tutorId, batchId: id, role: "lead" })),
          );
        }
      }
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return jsonError("A batch with that code already exists", 409, {
        fieldErrors: { code: ["Code already in use"] },
      });
    }
    throw error;
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "admin.batch_updated",
    entityType: "batch",
    entityId: id,
    summary: `Updated batch ${existing.code}`,
  });

  return jsonOk({ id });
}

/** Delete a batch — blocked while students are enrolled (any non-dropped status). */
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
    return jsonError("Invalid batch id", 400);
  }

  const existing = await db.query.batches.findFirst({
    where: eq(batches.id, id),
    columns: { id: true, code: true },
  });
  if (!existing) return jsonError("Batch not found", 404);

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(enrollments)
    .where(and(eq(enrollments.batchId, id), inArray(enrollments.status, ["active", "pending", "waitlisted"])));
  if ((n ?? 0) > 0) {
    return jsonError(
      "Students are still enrolled in this batch. Drop or remove them first.",
      409,
    );
  }

  await db.delete(batches).where(eq(batches.id, id));

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "admin.batch_deleted",
    entityType: "batch",
    entityId: id,
    summary: `Deleted batch ${existing.code}`,
  });

  return jsonOk({ id });
}
