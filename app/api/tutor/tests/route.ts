import { and, eq } from "drizzle-orm";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { createTestSchema } from "@/lib/validators/tutor-tests";
import { requireApiRole } from "@/lib/auth/api-guard";
import { db } from "@/db";
import { batches, courses, tests, tutorAssignments } from "@/db/schema";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

async function tutorTeachesCourse(tutorRowId: string, courseId: string): Promise<boolean> {
  const rows = await db
    .select({ id: batches.id })
    .from(tutorAssignments)
    .innerJoin(batches, eq(tutorAssignments.batchId, batches.id))
    .where(and(eq(tutorAssignments.tutorId, tutorRowId), eq(batches.courseId, courseId)))
    .limit(1);
  return rows.length > 0;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("tutor");
  if (guard.response) return guard.response;
  const tutor = guard.user;
  if (!tutor.tutorRowId) return jsonError("Tutor profile missing", 403);

  const parsed = await parseJsonBody(request, createTestSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const d = parsed.data;

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, d.courseId),
    columns: { id: true },
  });
  if (!course) {
    return jsonError("Select an existing course", 422, {
      fieldErrors: { courseId: ["Course not found"] },
    });
  }
  if (!(await tutorTeachesCourse(tutor.tutorRowId, d.courseId))) {
    return jsonError("You can only create tests for courses you teach", 403);
  }

  if (d.batchId) {
    const batch = await db.query.batches.findFirst({
      where: eq(batches.id, d.batchId),
      columns: { id: true, courseId: true },
    });
    if (!batch || batch.courseId !== d.courseId) {
      return jsonError("That batch does not belong to the selected course", 422, {
        fieldErrors: { batchId: ["Batch/Course mismatch"] },
      });
    }
  }

  if (d.startsAt && d.endsAt && d.startsAt >= d.endsAt) {
    return jsonError("The end time must be after the start time", 422, {
      fieldErrors: { endsAt: ["Must be after the start"] },
    });
  }

  const [row] = await db
    .insert(tests)
    .values({
      courseId: d.courseId,
      batchId: d.batchId ?? null,
      tutorId: tutor.tutorRowId,
      title: d.title,
      description: d.description ?? null,
      durationMinutes: d.durationMinutes,
      attemptsAllowed: d.attemptsAllowed,
      startsAt: d.startsAt ?? null,
      endsAt: d.endsAt ?? null,
      shuffleQuestions: d.shuffleQuestions,
      shuffleOptions: d.shuffleOptions,
      showAnswersAfter: d.showAnswersAfter,
      status: d.status,
    })
    .returning({ id: tests.id });

  await logAudit({
    actorId: tutor.id,
    actorRole: "tutor",
    action: "tutor.test_created",
    entityType: "test",
    entityId: row!.id,
    summary: `Created test “${d.title}”`,
  });

  return jsonOk({ id: row!.id });
}
