import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assignments } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { updateAssignmentSchema } from "@/lib/validators/tutor";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import { tutorOwnsBatch } from "@/lib/queries/tutor";

type Params = { params: Promise<{ id: string }> };

async function loadOwnedAssignment(id: string, tutorRowId: string) {
  const row = await db.query.assignments.findFirst({
    where: eq(assignments.id, id),
    columns: { id: true, tutorId: true, batchId: true, title: true, points: true },
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
  const existing = await loadOwnedAssignment(id, tutor.tutorRowId);
  if (!existing) return jsonError("Assignment not found", 404);

  const parsed = await parseJsonBody(request, updateAssignmentSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const d = parsed.data;

  if (d.batchId !== undefined && !(await tutorOwnsBatch(tutor.tutorRowId, d.batchId))) {
    return jsonError("You do not teach that batch", 403);
  }

  const set: Partial<typeof assignments.$inferInsert> = {};
  if (d.batchId !== undefined) set.batchId = d.batchId;
  if (d.title !== undefined) set.title = d.title;
  if (d.instructions !== undefined) set.instructions = d.instructions;
  if (d.dueAt !== undefined) set.dueAt = d.dueAt;
  if (d.points !== undefined) set.points = d.points;
  if (d.attachmentUrl !== undefined) set.attachmentUrl = d.attachmentUrl ?? null;
  if (d.attachmentName !== undefined) set.attachmentName = d.attachmentName ?? null;
  if (d.status !== undefined) set.status = d.status;
  set.updatedAt = new Date();

  await db.update(assignments).set(set).where(eq(assignments.id, existing.id));

  await logAudit({
    actorId: tutor.id,
    actorRole: "tutor",
    action: "tutor.assignment_updated",
    entityType: "assignment",
    entityId: existing.id,
    summary: `Updated assignment “${existing.title}”`,
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
  const existing = await loadOwnedAssignment(id, tutor.tutorRowId);
  if (!existing) return jsonError("Assignment not found", 404);

  await db.delete(assignments).where(eq(assignments.id, existing.id));

  await logAudit({
    actorId: tutor.id,
    actorRole: "tutor",
    action: "tutor.assignment_deleted",
    entityType: "assignment",
    entityId: existing.id,
    summary: `Deleted assignment “${existing.title}”`,
  });

  return jsonOk({ id: existing.id });
}
