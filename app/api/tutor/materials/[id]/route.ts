import { eq } from "drizzle-orm";
import { db } from "@/db";
import { batches, courses, materials } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { updateMaterialSchema } from "@/lib/validators/tutor";
import { requireApiRole } from "@/lib/auth/api-guard";
import { tutorOwnsBatch } from "@/lib/queries/tutor";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

async function loadOwnedMaterial(id: string, tutorRowId: string) {
  const row = await db.query.materials.findFirst({
    where: eq(materials.id, id),
    columns: { id: true, tutorId: true, title: true },
  });
  if (!row || row.tutorId !== tutorRowId) return null;
  return row;
}

export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("tutor");
  if (guard.response) return guard.response;
  const tutor = guard.user;
  if (!tutor.tutorRowId) return jsonError("Tutor profile missing", 403);

  const { id } = await params;
  const existing = await loadOwnedMaterial(id, tutor.tutorRowId);
  if (!existing) return jsonError("Material not found", 404);

  const parsed = await parseJsonBody(request, updateMaterialSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const d = parsed.data;

  if (d.courseId !== undefined) {
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, d.courseId),
      columns: { id: true },
    });
    if (!course) {
      return jsonError("Select an existing course", 422, {
        fieldErrors: { courseId: ["Course not found"] },
      });
    }
  }
  if (d.batchId) {
    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, d.batchId),
      columns: { id: true, courseId: true },
    });
    const courseId = d.courseId ?? null;
    if (!batch || (courseId && batch.courseId !== courseId)) {
      return jsonError("That batch does not belong to the selected course", 422, {
        fieldErrors: { batchId: ["Batch/Course mismatch"] },
      });
    }
    if (!(await tutorOwnsBatch(tutor.tutorRowId, d.batchId))) {
      return jsonError("You do not teach that batch", 403);
    }
  }

  const set: Partial<typeof materials.$inferInsert> = {};
  if (d.courseId !== undefined) set.courseId = d.courseId;
  if (d.batchId !== undefined) set.batchId = d.batchId ?? null;
  if (d.title !== undefined) set.title = d.title;
  if (d.description !== undefined) set.description = d.description ?? null;
  if (d.type !== undefined) set.type = d.type;
  if (d.url !== undefined) set.url = d.url;
  if (d.fileName !== undefined) set.fileName = d.fileName ?? null;
  if (d.fileSize !== undefined) set.fileSize = d.fileSize ?? null;
  if (d.tags !== undefined) set.tags = d.tags.length > 0 ? d.tags : null;
  set.updatedAt = new Date();

  await db.update(materials).set(set).where(eq(materials.id, existing.id));

  await logAudit({
    actorId: tutor.id,
    actorRole: "tutor",
    action: "tutor.material_updated",
    entityType: "material",
    entityId: existing.id,
    summary: `Updated material “${existing.title}”`,
  });

  return jsonOk({ id: existing.id });
}

export async function DELETE(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("tutor");
  if (guard.response) return guard.response;
  const tutor = guard.user;
  if (!tutor.tutorRowId) return jsonError("Tutor profile missing", 403);

  const { id } = await params;
  const existing = await loadOwnedMaterial(id, tutor.tutorRowId);
  if (!existing) return jsonError("Material not found", 404);

  await db.delete(materials).where(eq(materials.id, existing.id));

  await logAudit({
    actorId: tutor.id,
    actorRole: "tutor",
    action: "tutor.material_deleted",
    entityType: "material",
    entityId: existing.id,
    summary: `Removed material “${existing.title}”`,
  });

  return jsonOk({ id: existing.id });
}
