import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { attendance, tutorAssignments } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { markAttendanceSchema } from "@/lib/validators/tutor";
import { requireApiRole } from "@/lib/auth/api-guard";
import { listBatchRoster } from "@/lib/queries/tutor";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

/**
 * Mark (or update) attendance for every student listed in `entries`.
 * One row per student/batch/day — re-submitting updates existing marks.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("tutor");
  if (guard.response) return guard.response;
  const tutor = guard.user;
  if (!tutor.tutorRowId) return jsonError("Tutor profile missing", 403);

  const parsed = await parseJsonBody(request, markAttendanceSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const data = parsed.data;

  const owns = await db.query.tutorAssignments.findFirst({
    where: and(eq(tutorAssignments.tutorId, tutor.tutorRowId), eq(tutorAssignments.batchId, data.batchId)),
    columns: { id: true },
  });
  if (!owns) return jsonError("You do not teach that batch", 403);

  const roster = await listBatchRoster(data.batchId);
  const rosterIds = new Set(roster.map((r) => r.studentId));
  const invalid = data.entries.find((e) => !rosterIds.has(e.studentId));
  if (invalid) {
    return jsonError("One or more students are not in this batch", 422);
  }

  const now = new Date();
  for (const entry of data.entries) {
    await db
      .insert(attendance)
      .values({
        studentId: entry.studentId,
        batchId: data.batchId,
        slotId: data.slotId ?? null,
        day: data.day,
        status: entry.status,
        notes: entry.notes ?? null,
        markedBy: tutor.id,
        markedAt: now,
      })
      .onConflictDoUpdate({
        target: [attendance.studentId, attendance.batchId, attendance.day],
        set: {
          status: entry.status,
          notes: entry.notes ?? null,
          slotId: data.slotId ?? null,
          markedBy: tutor.id,
          markedAt: now,
          updatedAt: now,
        },
      });
  }

  await logAudit({
    actorId: tutor.id,
    actorRole: "tutor",
    action: "tutor.attendance_marked",
    entityType: "attendance",
    entityId: data.batchId,
    summary: `Marked attendance for ${data.entries.length} student(s) on ${data.day}`,
  });

  return jsonOk({ count: data.entries.length });
}
