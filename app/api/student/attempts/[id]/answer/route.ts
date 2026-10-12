import { and, eq } from "drizzle-orm";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { saveAnswerSchema } from "@/lib/validators/tutor-tests";
import { requireApiRole } from "@/lib/auth/api-guard";
import { db } from "@/db";
import { attemptAnswers, testAttempts, testQuestions } from "@/db/schema";
import { isSameOrigin } from "@/lib/security/csrf";

type Params = { params: Promise<{ id: string }> };

/** Autosave one answer while taking a test. */
export async function POST(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("student");
  if (guard.response) return guard.response;
  const student = guard.user;
  if (!student.studentRowId) return jsonError("Student profile missing", 403);

  const parsed = await parseJsonBody(request, saveAnswerSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const d = parsed.data;

  const { id } = await params;
  const attempt = await db.query.testAttempts.findFirst({
    where: eq(testAttempts.id, id),
    columns: { id: true, testId: true, studentId: true, status: true, expiresAt: true },
  });
  if (!attempt || attempt.studentId !== student.studentRowId) {
    return jsonError("Attempt not found", 404);
  }
  if (attempt.status !== "in_progress") {
    return jsonError("This attempt is already submitted", 409);
  }
  if (attempt.expiresAt <= new Date()) {
    return jsonError("Time is up — submit to finish", 409);
  }

  const belongs = await db
    .select({ id: testQuestions.id })
    .from(testQuestions)
    .where(and(eq(testQuestions.testId, attempt.testId), eq(testQuestions.questionId, d.questionId)))
    .limit(1);
  if (belongs.length === 0) {
    return jsonError("That question is not part of this test", 422);
  }

  const answer =
    d.key !== undefined && d.key !== null
      ? { key: d.key }
      : d.value !== undefined && d.value !== null
        ? { value: d.value }
        : { text: d.text ?? "" };

  const existing = await db.query.attemptAnswers.findFirst({
    where: and(eq(attemptAnswers.attemptId, attempt.id), eq(attemptAnswers.questionId, d.questionId)),
    columns: { id: true },
  });

  if (existing) {
    await db
      .update(attemptAnswers)
      .set({ answer, updatedAt: new Date() })
      .where(eq(attemptAnswers.id, existing.id));
  } else {
    await db
      .insert(attemptAnswers)
      .values({ attemptId: attempt.id, questionId: d.questionId, answer });
  }

  return jsonOk({ saved: true });
}

/** Tab-switch / blur counter (proctoring nudge, not a hard block). */
export async function PATCH(request: Request, { params }: Params) {
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
    columns: { id: true, studentId: true, status: true, tabSwitchCount: true },
  });
  if (!attempt || attempt.studentId !== student.studentRowId) {
    return jsonError("Attempt not found", 404);
  }
  if (attempt.status !== "in_progress") return jsonOk({ count: attempt.tabSwitchCount });

  const next = attempt.tabSwitchCount + 1;
  await db
    .update(testAttempts)
    .set({ tabSwitchCount: next, updatedAt: new Date() })
    .where(eq(testAttempts.id, attempt.id));

  return jsonOk({ count: next });
}
