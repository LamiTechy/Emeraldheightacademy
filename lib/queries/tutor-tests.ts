import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  attemptAnswers,
  batches,
  courses,
  enrollments,
  questions,
  students,
  tutorAssignments,
  testAttempts,
  testQuestions,
  tests,
  users,
} from "@/db/schema";

/** Courses a tutor teaches (via batch assignments). */
async function tutorCourseIds(tutorRowId: string): Promise<string[]> {
  const rows = await db
    .select({ id: courses.id })
    .from(tutorAssignments)
    .innerJoin(batches, eq(tutorAssignments.batchId, batches.id))
    .innerJoin(courses, eq(batches.courseId, courses.id))
    .where(eq(tutorAssignments.tutorId, tutorRowId))
    .groupBy(courses.id);
  return rows.map((r) => r.id);
}

/** Question bank entries created by this tutor (optionally one course). */
export async function listTutorQuestions(tutorRowId: string, courseId?: string | null) {
  const where =
    courseId && courseId.length > 0
      ? and(eq(questions.tutorId, tutorRowId), eq(questions.courseId, courseId))
      : eq(questions.tutorId, tutorRowId);

  const rows = await db
    .select({ q: questions, course: courses })
    .from(questions)
    .innerJoin(courses, eq(questions.courseId, courses.id))
    .where(where)
    .orderBy(desc(questions.createdAt));

  const allowed = new Set(await tutorCourseIds(tutorRowId));
  return rows.filter((r) => allowed.has(r.q.courseId));
}

/** Tests this tutor owns, with question/attempt counts. */
export async function listTutorTests(tutorRowId: string) {
  const rows = await db
    .select({ t: tests, course: courses, batch: batches })
    .from(tests)
    .innerJoin(courses, eq(tests.courseId, courses.id))
    .leftJoin(batches, eq(tests.batchId, batches.id))
    .where(eq(tests.tutorId, tutorRowId))
    .orderBy(desc(tests.createdAt));

  if (rows.length === 0) {
    return { rows: [], qCounts: new Map<string, number>(), aCounts: new Map<string, number>() };
  }
  const ids = rows.map((r) => r.t.id);
  const qRows = await db
    .select({ testId: testQuestions.testId, n: sql<number>`count(*)::int` })
    .from(testQuestions)
    .where(inArray(testQuestions.testId, ids))
    .groupBy(testQuestions.testId);
  const aRows = await db
    .select({ testId: testAttempts.testId, n: sql<number>`count(*)::int` })
    .from(testAttempts)
    .where(inArray(testAttempts.testId, ids))
    .groupBy(testAttempts.testId);

  return {
    rows,
    qCounts: new Map(qRows.map((r) => [r.testId, r.n])),
    aCounts: new Map(aRows.map((r) => [r.testId, r.n])),
  };
}

/** One test owned by the tutor (or null). */
export async function getOwnedTest(testId: string, tutorRowId: string) {
  const row = await db.query.tests.findFirst({
    where: eq(tests.id, testId),
    with: { course: true, batch: true },
  });
  if (!row || row.tutorId !== tutorRowId) return null;
  return row;
}

/** Questions attached to a test, ordered, with correct answers (tutor view). */
export async function listTestQuestionRows(testId: string) {
  return db
    .select({
      linkId: testQuestions.id,
      questionId: testQuestions.questionId,
      marks: testQuestions.marks,
      orderIndex: testQuestions.orderIndex,
      q: questions,
    })
    .from(testQuestions)
    .innerJoin(questions, eq(testQuestions.questionId, questions.id))
    .where(eq(testQuestions.testId, testId))
    .orderBy(asc(testQuestions.orderIndex));
}

/** Attempts on a test with student identity. */
export async function listTestAttempts(testId: string) {
  return db
    .select({
      a: testAttempts,
      studentId: students.id,
      studentCode: students.studentId,
      name: users.name,
      email: users.email,
    })
    .from(testAttempts)
    .innerJoin(students, eq(testAttempts.studentId, students.id))
    .innerJoin(users, eq(students.userId, users.id))
    .where(eq(testAttempts.testId, testId))
    .orderBy(desc(testAttempts.startedAt));
}

/** One attempt on a tutor-owned test, with student + answers. */
export async function getOwnedAttempt(attemptId: string, tutorRowId: string) {
  const row = await db.query.testAttempts.findFirst({
    where: eq(testAttempts.id, attemptId),
    with: {
      test: true,
      student: { with: { user: true } },
      answers: true,
    },
  });
  if (!row || row.test.tutorId !== tutorRowId) return null;
  return row;
}

/** Batch ids + course ids where a student is actively enrolled. */
async function studentEnrollments(studentRowId: string) {
  const rows = await db
    .select({ batchId: enrollments.batchId, courseId: batches.courseId })
    .from(enrollments)
    .innerJoin(batches, eq(enrollments.batchId, batches.id))
    .where(and(eq(enrollments.studentId, studentRowId), eq(enrollments.status, "active")));
  return {
    batchIds: rows.map((r) => r.batchId),
    courseIds: [...new Set(rows.map((r) => r.courseId))],
  };
}

/** Published tests visible to a student, with their attempts. */
export async function listStudentTests(studentRowId: string) {
  const { batchIds, courseIds } = await studentEnrollments(studentRowId);
  if (batchIds.length === 0) return [];

  const rows = await db
    .select({ t: tests, course: courses, batch: batches })
    .from(tests)
    .innerJoin(courses, eq(tests.courseId, courses.id))
    .leftJoin(batches, eq(tests.batchId, batches.id))
    .where(
      and(
        eq(tests.status, "published"),
        sql`((${tests.batchId} is not null and ${tests.batchId} in ${batchIds}) or (${tests.batchId} is null and ${tests.courseId} in ${courseIds}))`,
      ),
    )
    .orderBy(desc(tests.startsAt), desc(tests.createdAt));

  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.t.id);
  const attemptsRows = await db
    .select()
    .from(testAttempts)
    .where(and(inArray(testAttempts.testId, ids), eq(testAttempts.studentId, studentRowId)));
  const attemptsByTest = new Map<string, typeof attemptsRows>();
  for (const a of attemptsRows) {
    const list = attemptsByTest.get(a.testId) ?? [];
    list.push(a);
    attemptsByTest.set(a.testId, list);
  }
  const qCounts = await db
    .select({ testId: testQuestions.testId, n: sql<number>`count(*)::int` })
    .from(testQuestions)
    .where(inArray(testQuestions.testId, ids))
    .groupBy(testQuestions.testId);
  const qCountMap = new Map(qCounts.map((r) => [r.testId, r.n]));

  return rows.map((r) => ({
    test: r.t,
    course: r.course,
    batch: r.batch,
    questionCount: qCountMap.get(r.t.id) ?? 0,
    attempts: (attemptsByTest.get(r.t.id) ?? []).sort((a, b) => a.attemptNumber - b.attemptNumber),
  }));
}

/** Load a published test a student may take, or null. */
export async function getTestForStudent(testId: string, studentRowId: string) {
  const test = await db.query.tests.findFirst({
    where: eq(tests.id, testId),
    with: { course: true, batch: true },
  });
  if (!test || test.status !== "published") return null;

  const { batchIds, courseIds } = await studentEnrollments(studentRowId);
  const visible = test.batchId
    ? batchIds.includes(test.batchId)
    : courseIds.includes(test.courseId);
  if (!visible) return null;
  return test;
}

/** Answers for an attempt with question data (tutor grading view). */
export async function listAttemptAnswerRows(attemptId: string) {
  return db
    .select({ a: attemptAnswers, q: questions })
    .from(attemptAnswers)
    .innerJoin(questions, eq(attemptAnswers.questionId, questions.id))
    .where(eq(attemptAnswers.attemptId, attemptId));
}

/** Marks for a test's question set, keyed by questionId. */
export async function testMarksByKey(testId: string): Promise<Map<string, number>> {
  const rows = await db
    .select({ questionId: testQuestions.questionId, marks: testQuestions.marks })
    .from(testQuestions)
    .where(eq(testQuestions.testId, testId));
  return new Map(rows.map((r) => [r.questionId, Number(r.marks)]));
}

export type QuizQuestionPayload = {
  questionId: string;
  order: number;
  marks: number;
  type: string;
  difficulty: string;
  topic: string;
  stem: string;
  options: { key: string; text: string }[];
};

/** Student-safe quiz payload: NO correct answers leak to the client. */
export async function loadQuizPayload(
  testId: string,
  studentRowId: string,
): Promise<
  | { error: string }
  | {
      attemptId: string;
      expiresAt: string;
      attemptNumber: number;
      questions: QuizQuestionPayload[];
      saved: Record<string, { key?: string; value?: boolean; text?: string }>;
      tabSwitchCount: number;
    }
> {
  const attempt = await db.query.testAttempts.findFirst({
    where: and(eq(testAttempts.testId, testId), eq(testAttempts.studentId, studentRowId)),
    orderBy: desc(testAttempts.attemptNumber),
  });
  if (!attempt) return { error: "No active attempt" };
  if (attempt.status !== "in_progress") return { error: "Attempt already submitted" };

  const rows = await db
    .select({
      questionId: testQuestions.questionId,
      marks: testQuestions.marks,
      orderIndex: testQuestions.orderIndex,
      q: questions,
    })
    .from(testQuestions)
    .innerJoin(questions, eq(testQuestions.questionId, questions.id))
    .where(eq(testQuestions.testId, testId))
    .orderBy(asc(testQuestions.orderIndex));

  const answers = await db
    .select()
    .from(attemptAnswers)
    .where(eq(attemptAnswers.attemptId, attempt.id));
  const saved: Record<string, { key?: string; value?: boolean; text?: string }> = {};
  for (const a of answers) {
    if (a.answer) saved[a.questionId] = a.answer;
  }

  return {
    attemptId: attempt.id,
    expiresAt: attempt.expiresAt.toISOString(),
    attemptNumber: attempt.attemptNumber,
    tabSwitchCount: attempt.tabSwitchCount,
    saved,
    questions: rows.map((r, i) => ({
      questionId: r.questionId,
      order: i + 1,
      marks: Number(r.marks),
      type: r.q.type,
      difficulty: r.q.difficulty,
      topic: r.q.topic,
      stem: r.q.stem,
      options: r.q.options,
    })),
  };
}

/** Result payload after submission (scores only; answers shown when allowed). */
export async function loadAttemptResult(attemptId: string, studentRowId: string) {
  const attempt = await db.query.testAttempts.findFirst({
    where: eq(testAttempts.id, attemptId),
    with: { test: true },
  });
  if (!attempt || attempt.studentId !== studentRowId) return null;
  if (attempt.status === "in_progress") return null;
  return {
    id: attempt.id,
    status: attempt.status,
    totalScore: attempt.totalScore === null ? null : Number(attempt.totalScore),
    maxScore: attempt.maxScore === null ? null : Number(attempt.maxScore),
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    autoSubmitted: attempt.autoSubmitted,
    showAnswers: attempt.test.showAnswersAfter && attempt.status === "graded",
    title: attempt.test.title,
  };
}
