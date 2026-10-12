import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { batches, courses, enrollments } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody, isUniqueViolation } from "@/lib/api";
import { updateCourseSchema } from "@/lib/validators/admin";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

/** Update a course (slug stays stable to protect links). */
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
    return jsonError("Invalid course id", 400);
  }

  const parsed = await parseJsonBody(request, updateCourseSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const data = parsed.data;

  const existing = await db.query.courses.findFirst({
    where: eq(courses.id, id),
    columns: { id: true, code: true },
  });
  if (!existing) return jsonError("Course not found", 404);

  try {
    await db
      .update(courses)
      .set({
        code: data.code?.toUpperCase(),
        name: data.name,
        category: data.category,
        description: data.description,
        longDescription: data.longDescription,
        durationWeeks: data.durationWeeks,
        scheduleSummary: data.scheduleSummary,
        mode: data.mode,
        status: data.status,
        featured: data.featured,
        sortOrder: data.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id));
  } catch (error) {
    if (isUniqueViolation(error)) {
      return jsonError("A course with that code already exists", 409, {
        fieldErrors: { code: ["Code already in use"] },
      });
    }
    throw error;
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "admin.course_updated",
    entityType: "course",
    entityId: id,
    summary: `Updated course ${existing.code}`,
  });

  return jsonOk({ id });
}

/**
 * Delete a course (cascades to its batches/slots) — blocked while any
 * enrollments exist; archive those instead.
 */
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
    return jsonError("Invalid course id", 400);
  }

  const existing = await db.query.courses.findFirst({
    where: eq(courses.id, id),
    columns: { id: true, code: true, name: true },
  });
  if (!existing) return jsonError("Course not found", 404);

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(enrollments)
    .innerJoin(batches, eq(enrollments.batchId, batches.id))
    .where(eq(batches.courseId, id));
  if ((n ?? 0) > 0) {
    return jsonError(
      "This course still has enrollments. Remove or drop them first, or archive the course instead.",
      409,
    );
  }

  await db.delete(courses).where(eq(courses.id, id));

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "admin.course_deleted",
    entityType: "course",
    entityId: id,
    summary: `Deleted course ${existing.code}`,
  });

  return jsonOk({ id });
}
