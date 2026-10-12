import { z } from "zod";
import { eq } from "drizzle-orm";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { gradeAttemptSchema } from "@/lib/validators/tutor-tests";
import { requireApiRole } from "@/lib/auth/api-guard";
import { getOwnedAttempt, testMarksByKey } from "@/lib/queries/tutor-tests";
import { gradeAndFinalizeAttempt } from "@/lib/grading";
import { db } from "@/db";
import { attemptAnswers, testAttempts } from "@/db/schema";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

const bodySchema = gradeAttemptSchema.extend({
  attemptId: z.uuid("Attempt required"),
});

type Params = { params: Promise<{ id: string }> };

/** Grade short-answer (or override auto-graded) answers, then finalize totals. */
export async function POST(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("tutor");
  if (guard.response) return guard.response;
  const tutor = guard.user;
  if (!tutor.tutorRowId) return jsonError("Tutor profile missing", 403);

  const parsed = await parseJsonBody(request, bodySchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const d = parsed.data;

  const { id } = await params;
  const attempt = await getOwnedAttempt(id, tutor.tutorRowId);
  if (!attempt) return jsonError("Attempt not found", 404);
  if (attempt.status === "in_progress") {
    return jsonError("The student has not submitted this attempt yet", 422);
  }

  const marks = await testMarksByKey(attempt.testId);

  for (const item of d.answers) {
    const answer = await db.query.attemptAnswers.findFirst({
      where: eq(attemptAnswers.id, item.answerId),
      columns: { id: true, attemptId: true, questionId: true },
    });
    if (!answer || answer.attemptId !== attempt.id) {
      return jsonError("One or more answers belong to a different attempt", 422);
    }
    const max = marks.get(answer.questionId) ?? 0;
    if (item.awardedMarks > max) {
      return jsonError(`A score exceeds the question's maximum of ${max}`, 422);
    }
    await db
      .update(attemptAnswers)
      .set({
        awardedMarks: String(item.awardedMarks),
        feedback: item.feedback ?? null,
        isCorrect: item.awardedMarks > 0,
        gradedBy: tutor.id,
        gradedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(attemptAnswers.id, answer.id));
  }

  let summary: {
    totalScore: number;
    maxScore: number;
    pendingManual: number;
    status: "submitted" | "graded";
  } = { totalScore: 0, maxScore: 0, pendingManual: 0, status: "graded" };
  if (d.finalize) {
    summary = await gradeAndFinalizeAttempt(attempt.id);
  }

  await logAudit({
    actorId: tutor.id,
    actorRole: "tutor",
    action: "tutor.attempt_graded",
    entityType: "test_attempt",
    entityId: attempt.id,
    summary: `Graded ${d.answers.length} answer(s) on “${attempt.test.title}” (${attempt.student.user.name})`,
  });

  return jsonOk({
    id: attempt.id,
    totalScore: summary.totalScore,
    maxScore: summary.maxScore,
    pendingManual: summary.pendingManual,
    status: summary.status,
  });
}

/** Force-finalize an attempt (auto-graded parts only). */
export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("tutor");
  if (guard.response) return guard.response;
  const tutor = guard.user;
  if (!tutor.tutorRowId) return jsonError("Tutor profile missing", 403);

  const { id } = await params;
  const attempt = await getOwnedAttempt(id, tutor.tutorRowId);
  if (!attempt) return jsonError("Attempt not found", 404);
  if (attempt.status === "in_progress") {
    return jsonError("The student has not submitted this attempt yet", 422);
  }

  const summary = await gradeAndFinalizeAttempt(attempt.id);

  await logAudit({
    actorId: tutor.id,
    actorRole: "tutor",
    action: "tutor.attempt_finalized",
    entityType: "test_attempt",
    entityId: attempt.id,
    summary: `Finalized “${attempt.test.title}” for ${attempt.student.user.name} (${summary.totalScore}/${summary.maxScore})`,
  });

  await db
    .update(testAttempts)
    .set({ updatedAt: new Date() })
    .where(eq(testAttempts.id, attempt.id));

  return jsonOk(summary);
}
