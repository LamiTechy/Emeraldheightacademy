import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { createAssignmentSchema } from "@/lib/validators/tutor";
import { requireApiRole } from "@/lib/auth/api-guard";
import { tutorOwnsBatch } from "@/lib/queries/tutor";
import { db } from "@/db";
import { assignments } from "@/db/schema";
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

  const parsed = await parseJsonBody(request, createAssignmentSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const data = parsed.data;

  if (!(await tutorOwnsBatch(tutor.tutorRowId, data.batchId))) {
    return jsonError("You do not teach that batch", 403);
  }

  const [row] = await db
    .insert(assignments)
    .values({
      batchId: data.batchId,
      tutorId: tutor.tutorRowId,
      title: data.title,
      instructions: data.instructions,
      dueAt: data.dueAt,
      points: data.points,
      attachmentUrl: data.attachmentUrl ?? null,
      attachmentName: data.attachmentName ?? null,
      status: data.status,
    })
    .returning({ id: assignments.id });

  await logAudit({
    actorId: tutor.id,
    actorRole: "tutor",
    action: "tutor.assignment_created",
    entityType: "assignment",
    entityId: row!.id,
    summary: `Created assignment “${data.title}”`,
  });

  return jsonOk({ id: row!.id });
}
