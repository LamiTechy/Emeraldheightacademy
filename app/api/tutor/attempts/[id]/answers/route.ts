import { jsonError, jsonOk } from "@/lib/api";
import { requireApiRole } from "@/lib/auth/api-guard";
import { getOwnedAttempt, listAttemptAnswerRows, testMarksByKey } from "@/lib/queries/tutor-tests";
import { db } from "@/db";

type Params = { params: Promise<{ id: string }> };

/** Answers for one attempt on a tutor-owned test (grading view). */
export async function GET(_request: Request, { params }: Params) {
  const guard = await requireApiRole("tutor");
  if (guard.response) return guard.response;
  const tutor = guard.user;
  if (!tutor.tutorRowId) return jsonError("Tutor profile missing", 403);

  const { id } = await params;
  const attempt = await getOwnedAttempt(id, tutor.tutorRowId);
  if (!attempt) return jsonError("Attempt not found", 404);

  const marks = await testMarksByKey(attempt.testId);
  const rows = await listAttemptAnswerRows(attempt.id);

  // Include unanswered questions as empty rows so the tutor sees full coverage.
  const answeredIds = new Set(rows.map((r) => r.a.questionId));
  const missingIds = [...marks.keys()].filter((qid) => !answeredIds.has(qid));
  const missingQuestions = missingIds.length
    ? await db.query.questions.findMany({
        where: (q, { inArray }) => inArray(q.id, missingIds),
      })
    : [];

  const combined: {
    answer: (typeof rows)[number]["a"] | null;
    question: (typeof rows)[number]["q"];
  }[] = [
    ...rows.map((r) => ({ answer: r.a, question: r.q })),
    ...missingQuestions.map((q) => ({ answer: null, question: q })),
  ];

  return jsonOk({
    answers: combined.map((r) => {
      const answer = r.answer?.answer as
        | { key?: string; value?: boolean; text?: string }
        | null
        | undefined;
      return {
        id: r.answer?.id ?? "",
        questionId: r.question.id,
        type: r.question.type,
        stem: r.question.stem,
        options: r.question.options,
        correctAnswer: r.question.correctAnswer,
        explanation: r.question.explanation,
        marks: marks.get(r.question.id) ?? 1,
        answerKey: answer?.key,
        answerValue: answer?.value,
        answerText: answer?.text,
        isCorrect: r.answer?.isCorrect ?? null,
        awardedMarks: r.answer?.awardedMarks ? Number(r.answer.awardedMarks) : 0,
        feedback: r.answer?.feedback ?? null,
        needsManual: r.question.type === "short_answer" && (r.answer?.isCorrect ?? null) === null,
      };
    }),
  });
}
