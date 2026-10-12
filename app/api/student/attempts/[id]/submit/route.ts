import { and, eq, sql } from "drizzle-orm";
import { jsonError, jsonOk } from "@/lib/api";
import { requireApiRole } from "@/lib/auth/api-guard";
import { db } from "@/db";
import { attemptAnswers, testAttempts, testQuestions } from "@/db/schema";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

/** Submit an in-progress attempt (also used for auto-submit when the timer expires). */
export async function POST(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("student");
  if (guard.response) return guard.response;
  const student = guard.user;
  if (!student.studentRowId) return jsonError("Student profile missing", 403);

  const { id } = await params;
  const attempt = await db.query.testAttempts.findFirst({
    where: eq(testAttempts.id, id),
    with: { test: true },
  });
  if (!attempt || attempt.studentId !== student.studentRowId) {
    return jsonError("Attempt not found", 404);
  }
  if (attempt.status !== "in_progress") {
    return jsonError("This attempt is already submitted", 409);
  }

  const now = new Date();
  const auto = attempt.expiresAt <= now;

  // Optional: accept a final batch of answers with the submit call.
  let saved = 0;
  try {
    const body = (await request.json()) as {
      answers?: { questionId: string; key?: string | null; value?: boolean | null; text?: string | null }[];
    };
    if (Array.isArray(body.answers)) {
      const validIds = new Set(
        (
          await db
            .select({ questionId: testQuestions.questionId })
            .from(testQuestions)
            .where(eq(testQuestions.testId, attempt.testId))
        ).map((r) => r.questionId),
      );
      for (const a of body.answers) {
        if (!validIds.has(a.questionId)) continue;
        await saveAnswer(attempt.id, a.questionId, a.key, a.value, a.text);
        saved += 1;
      }
    }
  } catch {
    // No JSON body is fine — submit with previously saved answers.
  }

  await db
    .update(testAttempts)
    .set({
      status: "submitted",
      submittedAt: now,
      autoSubmitted: auto,
      updatedAt: now,
    })
    .where(eq(testAttempts.id, attempt.id));

  // Auto-grade objective questions; short answers may stay pending.
  const { gradeAndFinalizeAttempt } = await import("@/lib/grading");
  const summary = await gradeAndFinalizeAttempt(attempt.id);

  await logAudit({
    actorId: student.id,
    actorRole: "student",
    action: "student.attempt_submitted",
    entityType: "test_attempt",
    entityId: attempt.id,
    summary: `Submitted “${attempt.test.title}”${auto ? " (auto, time up)" : ""}`,
  });

  return jsonOk({
    id: attempt.id,
    autoSubmitted: auto,
    saved,
    status: summary.status,
    totalScore: summary.totalScore,
    maxScore: summary.maxScore,
    pendingManual: summary.pendingManual,
    showAnswers: attempt.test.showAnswersAfter && summary.pendingManual === 0,
  });
}

async function saveAnswer(
  attemptId: string,
  questionId: string,
  key?: string | null,
  value?: boolean | null,
  text?: string | null,
) {
  const answer =
    key !== undefined && key !== null
      ? { key }
      : value !== undefined && value !== null
        ? { value }
        : { text: text ?? "" };

  const [{ n } = { n: 0 }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(attemptAnswers)
    .where(and(eq(attemptAnswers.attemptId, attemptId), eq(attemptAnswers.questionId, questionId)));

  if ((n ?? 0) > 0) {
    await db
      .update(attemptAnswers)
      .set({ answer, updatedAt: new Date() })
      .where(and(eq(attemptAnswers.attemptId, attemptId), eq(attemptAnswers.questionId, questionId)));
  } else {
    await db.insert(attemptAnswers).values({ attemptId, questionId, answer });
  }
}
