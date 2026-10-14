import { db } from "@/db";
import { timetableSlots } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { createSlotSchema } from "@/lib/validators/admin";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import { normalizeTime } from "@/lib/format";
import { findTutorSlotOverlap } from "@/lib/queries/timetable";

/** Add a timetable slot (weekly recurring session). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const parsed = await parseJsonBody(request, createSlotSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const data = parsed.data;

  const overlap = await findTutorSlotOverlap(data.tutorId, data.dayOfWeek, data.startTime, data.endTime);
  if (overlap) {
    return jsonError(
      `That tutor already teaches ${overlap.startTime}–${overlap.endTime} on that day`,
      409,
      { fieldErrors: { startTime: ["Overlaps an existing session"] } },
    );
  }

  const [row] = await db
    .insert(timetableSlots)
    .values({
      batchId: data.batchId,
      tutorId: data.tutorId,
      dayOfWeek: data.dayOfWeek,
      startTime: normalizeTime(data.startTime),
      endTime: normalizeTime(data.endTime),
      room: data.room ?? null,
      meetingUrl: null,
      validFrom: data.validFrom ?? null,
      validTo: data.validTo ?? null,
    })
    .returning({ id: timetableSlots.id });

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "admin.timetable_slot_created",
    entityType: "timetable_slot",
    entityId: row!.id,
    summary: `Added timetable slot (day ${data.dayOfWeek}, ${data.startTime})`,
  });

  return jsonOk({ id: row!.id });
}
