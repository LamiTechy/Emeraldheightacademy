import "server-only";
import { and, eq, lt, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { timetableSlots } from "@/db/schema";
import { normalizeTime } from "@/lib/format";

/** Finds another slot for the same tutor/day with overlapping times. */
export async function findTutorSlotOverlap(
  tutorId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  excludeSlotId?: string,
) {
  const start = normalizeTime(startTime);
  const end = normalizeTime(endTime);
  const conditions = [
    eq(timetableSlots.tutorId, tutorId),
    eq(timetableSlots.dayOfWeek, dayOfWeek),
    lt(timetableSlots.startTime, end),
    sql`${timetableSlots.endTime} > ${start}`,
  ];
  if (excludeSlotId) {
    conditions.push(ne(timetableSlots.id, excludeSlotId));
  }
  return db.query.timetableSlots.findFirst({
    where: and(...conditions),
    columns: { id: true, startTime: true, endTime: true },
  });
}
