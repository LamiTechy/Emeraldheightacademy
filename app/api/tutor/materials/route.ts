import { eq } from "drizzle-orm";
import { db } from "@/db";
import { batches, courses, materials } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { createMaterialSchema } from "@/lib/validators/tutor";
import { requireApiRole } from "@/lib/auth/api-guard";
import { tutorOwnsBatch } from "@/lib/queries/tutor";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("tutor");
  if (guard.response) return guard.response;
  const tutor = guard.user;
  if (!tutor.tutorRowId) return jsonError("Tutor profile missing", 403);

  const parsed = await parseJsonBody(request, createMaterialSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const data = parsed.data;

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, data.courseId),
    columns: { id: true },
  });
  if (!course) {
    return jsonError("Select an existing course", 422, {
      fieldErrors: { courseId: ["Course not found"] },
    });
  }

  if (data.batchId) {
    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, data.batchId),
      columns: { id: true, courseId: true },
    });
    if (!batch || batch.courseId !== data.courseId) {
      return jsonError("That batch does not belong to the selected course", 422, {
        fieldErrors: { batchId: ["Batch/course mismatch"] },
      });
    }
    if (!(await tutorOwnsBatch(tutor.tutorRowId, data.batchId))) {
      return jsonError("You do not teach that batch", 403);
    }
  }

  const [row] = await db
    .insert(materials)
    .values({
      courseId: data.courseId,
      batchId: data.batchId ?? null,
      tutorId: tutor.tutorRowId,
      title: data.title,
      description: data.description ?? null,
      type: data.type,
      url: data.url,
      fileName: data.fileName ?? null,
      fileSize: data.fileSize ?? null,
      tags: data.tags.length > 0 ? data.tags : null,
    })
    .returning({ id: materials.id });

  await logAudit({
    actorId: tutor.id,
    actorRole: "tutor",
    action: "tutor.material_created",
    entityType: "material",
    entityId: row!.id,
    summary: `Shared material “${data.title}”`,
  });

  return jsonOk({ id: row!.id });
}
