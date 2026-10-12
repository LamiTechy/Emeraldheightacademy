import { eq } from "drizzle-orm";
import { db } from "@/db";
import { timetableSlots } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { updateSlotSchema } from "@/lib/validators/admin";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import { normalizeTime } from "@/lib/format";
import { findTutorSlotOverlap } from "@/lib/queries/timetable";
import { z } from "zod";

/** Update a timetable slot. */
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
    return jsonError("Invalid slot id", 400);
  }

  const parsed = await parseJsonBody(request, updateSlotSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const data = parsed.data;

  const existing = await db.query.timetableSlots.findFirst({
    where: eq(timetableSlots.id, id),
    columns: {
      id: true,
      tutorId: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
    },
  });
  if (!existing) return jsonError("Slot not found", 404);

  const tutorId = data.tutorId ?? existing.tutorId;
  const dayOfWeek = data.dayOfWeek ?? existing.dayOfWeek;
  const startTime = data.startTime ?? existing.startTime;
  const endTime = data.endTime ?? existing.endTime;

  const overlap = await findTutorSlotOverlap(tutorId, dayOfWeek, startTime, endTime, id);
  if (overlap) {
    return jsonError(
      `That tutor already teaches ${overlap.startTime}–${overlap.endTime} on that day`,
      409,
      { fieldErrors: { startTime: ["Overlaps an existing session"] } },
    );
  }

  await db
    .update(timetableSlots)
    .set({
      batchId: data.batchId,
      tutorId: data.tutorId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime ? normalizeTime(data.startTime) : undefined,
      endTime: data.endTime ? normalizeTime(data.endTime) : undefined,
      room: data.room,
      meetingUrl: data.meetingUrl,
      validFrom: data.validFrom,
      validTo: data.validTo,
      updatedAt: new Date(),
    })
    .where(eq(timetableSlots.id, id));

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "admin.timetable_slot_updated",
    entityType: "timetable_slot",
    entityId: id,
    summary: "Updated timetable slot",
  });

  return jsonOk({ id });
}

/** Delete a timetable slot. */
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
    return jsonError("Invalid slot id", 400);
  }

  const existing = await db.query.timetableSlots.findFirst({
    where: eq(timetableSlots.id, id),
    columns: { id: true },
  });
  if (!existing) return jsonError("Slot not found", 404);

  await db.delete(timetableSlots).where(eq(timetableSlots.id, id));

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "admin.timetable_slot_deleted",
    entityType: "timetable_slot",
    entityId: id,
    summary: "Deleted timetable slot",
  });

  return jsonOk({ id });
}
