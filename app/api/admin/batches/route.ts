import { dbTx } from "@/db";
import { batches, tutorAssignments } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody, isUniqueViolation } from "@/lib/api";
import { createBatchSchema } from "@/lib/validators/admin";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import { normalizeTime } from "@/lib/format";

/** Create a batch and assign its lead tutor(s). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const parsed = await parseJsonBody(request, createBatchSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const data = parsed.data;

  try {
    const id = await dbTx.transaction(async (tx) => {
      const [batch] = await tx
        .insert(batches)
        .values({
          courseId: data.courseId,
          name: data.name,
          code: data.code.toUpperCase(),
          daysOfWeek: data.daysOfWeek,
          startTime: normalizeTime(data.startTime),
          endTime: normalizeTime(data.endTime),
          mode: data.mode,
          room: data.room ?? null,
          meetingUrl: data.meetingUrl ?? null,
          capacity: data.capacity,
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
        })
        .returning({ id: batches.id });

      if (data.tutorIds.length > 0) {
        await tx.insert(tutorAssignments).values(
          data.tutorIds.map((tutorId) => ({
            tutorId,
            batchId: batch!.id,
            role: "lead",
          })),
        );
      }
      return batch!.id;
    });

    await logAudit({
      actorId: admin.id,
      actorRole: "admin",
      action: "admin.batch_created",
      entityType: "batch",
      entityId: id,
      summary: `Created batch ${data.code.toUpperCase()}`,
    });

    return jsonOk({ id });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return jsonError("A batch with that code already exists", 409, {
        fieldErrors: { code: ["Code already in use"] },
      });
    }
    throw error;
  }
}
