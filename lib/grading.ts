import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  attemptAnswers,
  questions,
  testAttempts,
  testQuestions,
  type AnswerValue,
  type CorrectAnswer,
} from "@/db/schema";

/** Auto-grade a single answer against a question's correct answer. */
export function gradeAnswerValue(
  question: { type: string; correctAnswer: CorrectAnswer },
  answer: AnswerValue | null | undefined,
): { isCorrect: boolean | null; marks: number } {
  if (!answer) return { isCorrect: false, marks: 0 };

  if (question.type === "mcq") {
    return { isCorrect: !!answer.key && answer.key === question.correctAnswer.key, marks: 0 };
  }
  if (question.type === "true_false") {
    return {
      isCorrect:
        typeof answer.value === "boolean" && answer.value === question.correctAnswer.value,
      marks: 0,
    };
  }
  // short_answer — auto-match accepted answers (case-insensitive); else needs manual grading.
  const text = (answer.text ?? "").trim().toLowerCase();
  if (!text) return { isCorrect: false, marks: 0 };
  const accepted = (question.correctAnswer.accepted ?? []).map((a) => a.trim().toLowerCase());
  if (accepted.includes(text)) return { isCorrect: true, marks: 0 };
  return { isCorrect: null, marks: 0 }; // pending manual review
}

/**
 * Grade all auto-gradable answers for an attempt and set its totals.
 * If any short-answer is unmarked, the attempt stays "submitted" (pending review);
 * otherwise it becomes "graded".
 */
export async function gradeAndFinalizeAttempt(attemptId: string): Promise<{
  totalScore: number;
  maxScore: number;
  pendingManual: number;
  status: "submitted" | "graded";
}> {
  const attempt = await loadAttempt(attemptId);
  const tq = await db
    .select({
      questionId: testQuestions.questionId,
      marks: testQuestions.marks,
      q: questions,
    })
    .from(testQuestions)
    .innerJoin(questions, eq(testQuestions.questionId, questions.id))
    .where(eq(testQuestions.testId, attempt.testId));

  const answers = await db
    .select()
    .from(attemptAnswers)
    .where(eq(attemptAnswers.attemptId, attemptId));

  const answerByQ = new Map(answers.map((a) => [a.questionId, a]));
  let total = 0;
  let max = 0;
  let pendingManual = 0;

  for (const row of tq) {
    const marks = Number(row.marks);
    max += marks;
    const existing = answerByQ.get(row.questionId);
    // Skip answers already manually graded (gradedAt set) — preserve tutor decisions.
    if (existing?.gradedAt) {
      total += Number(existing.awardedMarks ?? 0);
      continue;
    }
    const result = gradeAnswerValue(row.q, existing?.answer ?? null);
    if (result.isCorrect === null) {
      pendingManual += 1;
      continue;
    }
    const awarded = result.isCorrect ? marks : 0;
    total += awarded;
    if (existing) {
      await db
        .update(attemptAnswers)
        .set({ isCorrect: result.isCorrect, awardedMarks: String(awarded), updatedAt: new Date() })
        .where(eq(attemptAnswers.id, existing.id));
    } else {
      await db.insert(attemptAnswers).values({
        attemptId,
        questionId: row.questionId,
        answer: null,
        isCorrect: result.isCorrect,
        awardedMarks: String(awarded),
      });
    }
  }

  const status = pendingManual > 0 ? "submitted" : "graded";
  await db
    .update(testAttempts)
    .set({
      totalScore: String(total),
      maxScore: String(max),
      status,
      updatedAt: new Date(),
    })
    .where(eq(testAttempts.id, attemptId));

  return { totalScore: total, maxScore: max, pendingManual, status };
}

async function loadAttempt(attemptId: string) {
  const attempt = await db.query.testAttempts.findFirst({
    where: eq(testAttempts.id, attemptId),
    columns: { id: true, testId: true },
  });
  if (!attempt) throw new Error("Attempt not found");
  return attempt;
}

/** Load questions of a test with their test-level marks, ordered. */
export async function loadTestQuestions(testId: string) {
  return db
    .select({
      questionId: testQuestions.questionId,
      marks: testQuestions.marks,
      orderIndex: testQuestions.orderIndex,
      q: questions,
    })
    .from(testQuestions)
    .innerJoin(questions, eq(testQuestions.questionId, questions.id))
    .where(eq(testQuestions.testId, testId))
    .orderBy(testQuestions.orderIndex);
}

/** Sum of marks for a set of test questions. */
export function sumMarks(rows: { marks: string }[]): number {
  return rows.reduce((acc, r) => acc + Number(r.marks), 0);
}

/** Deterministic shuffle seeded by a string (stable per attempt). */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    const j = (h >>> 0) % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** True when a question still needs manual grading inside an attempt. */
export function needsManualGrade(type: string, isCorrect: boolean | null): boolean {
  return type === "short_answer" && isCorrect === null;
}

export function questionsUsedInAttempts(questionIds: string[]): Promise<{ id: string }[]> {
  if (questionIds.length === 0) return Promise.resolve([]);
  return db
    .select({ id: attemptAnswers.questionId })
    .from(attemptAnswers)
    .where(inArray(attemptAnswers.questionId, questionIds))
    .groupBy(attemptAnswers.questionId);
}

export async function deleteQuestionIfUnused(
  questionId: string,
): Promise<"deleted" | "in-use"> {
  const used = await db
    .select({ id: attemptAnswers.id })
    .from(attemptAnswers)
    .where(eq(attemptAnswers.questionId, questionId))
    .limit(1);
  if (used.length > 0) return "in-use";
  // Also remove any test links before deleting.
  await db.delete(testQuestions).where(eq(testQuestions.questionId, questionId));
  await db.delete(questions).where(eq(questions.id, questionId));
  return "deleted";
}

export async function hasAttemptInTest(testId: string, studentId: string, allowed: number) {
  const rows = await db
    .select({ id: testAttempts.id })
    .from(testAttempts)
    .where(and(eq(testAttempts.testId, testId), eq(testAttempts.studentId, studentId)))
    .limit(allowed + 1);
  return rows.length;
}
