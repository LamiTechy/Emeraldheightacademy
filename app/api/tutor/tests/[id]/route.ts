import { eq } from "drizzle-orm";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { updateTestSchema } from "@/lib/validators/tutor-tests";
import { requireApiRole } from "@/lib/auth/api-guard";
import { getOwnedTest } from "@/lib/queries/tutor-tests";
import { db } from "@/db";
import { testAttempts, tests } from "@/db/schema";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("tutor");
  if (guard.response) return guard.response;
  const tutor = guard.user;
  if (!tutor.tutorRowId) return jsonError("Tutor profile missing", 403);

  const { id } = await params;
  const existing = await getOwnedTest(id, tutor.tutorRowId);
  if (!existing) return jsonError("Test not found", 404);

  const parsed = await parseJsonBody(request, updateTestSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const d = parsed.data;

  if (d.startsAt !== undefined && d.endsAt !== undefined && d.startsAt && d.endsAt && d.startsAt >= d.endsAt) {
    return jsonError("The end time must be after the start time", 422, {
      fieldErrors: { endsAt: ["Must be after the start"] },
    });
  }

  const set: Partial<typeof tests.$inferInsert> = {};
  if (d.courseId !== undefined) set.courseId = d.courseId;
  if (d.batchId !== undefined) set.batchId = d.batchId ?? null;
  if (d.title !== undefined) set.title = d.title;
  if (d.description !== undefined) set.description = d.description ?? null;
  if (d.durationMinutes !== undefined) set.durationMinutes = d.durationMinutes;
  if (d.attemptsAllowed !== undefined) set.attemptsAllowed = d.attemptsAllowed;
  if (d.startsAt !== undefined) set.startsAt = d.startsAt ?? null;
  if (d.endsAt !== undefined) set.endsAt = d.endsAt ?? null;
  if (d.shuffleQuestions !== undefined) set.shuffleQuestions = d.shuffleQuestions;
  if (d.shuffleOptions !== undefined) set.shuffleOptions = d.shuffleOptions;
  if (d.showAnswersAfter !== undefined) set.showAnswersAfter = d.showAnswersAfter;
  if (d.status !== undefined) set.status = d.status;
  set.updatedAt = new Date();

  await db.update(tests).set(set).where(eq(tests.id, existing.id));

  await logAudit({
    actorId: tutor.id,
    actorRole: "tutor",
    action: "tutor.test_updated",
    entityType: "test",
    entityId: existing.id,
    summary: `Updated test “${existing.title}”`,
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
  const existing = await getOwnedTest(id, tutor.tutorRowId);
  if (!existing) return jsonError("Test not found", 404);

  const attemptCount = await db
    .select({ id: testAttempts.id })
    .from(testAttempts)
    .where(eq(testAttempts.testId, existing.id))
    .limit(1);
  if (attemptCount.length > 0) {
    return jsonError(
      "This test already has student attempts — close it instead of deleting",
      409,
    );
  }

  await db.delete(tests).where(eq(tests.id, existing.id));

  await logAudit({
    actorId: tutor.id,
    actorRole: "tutor",
    action: "tutor.test_deleted",
    entityType: "test",
    entityId: existing.id,
    summary: `Deleted test “${existing.title}”`,
  });

  return jsonOk({ id: existing.id });
}
