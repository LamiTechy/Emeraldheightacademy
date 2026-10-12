export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { TestsClient } from "@/components/tutor/tests-client";
import type { QuestionView, TestView } from "@/components/tutor/test-types";
import { requireUser } from "@/lib/auth/session";
import { listTutorTests, listTutorQuestions } from "@/lib/queries/tutor-tests";
import { listTutorCourseTree } from "@/lib/queries/tutor";
import { formatDate, formatDateTime } from "@/lib/format";

export default async function TutorTestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("tutor");
  const sp = await searchParams;
  const statusFilter = typeof sp.status === "string" ? sp.status : null;

  const [data, courses] = user.tutorRowId
    ? await Promise.all([listTutorTests(user.tutorRowId), listTutorCourseTree(user.tutorRowId)])
    : [{ rows: [], qCounts: new Map<string, number>(), aCounts: new Map<string, number>() }, []];

  const views: TestView[] = data.rows
    .filter((r) => !statusFilter || r.t.status === statusFilter)
    .map((r) => ({
      id: r.t.id,
      title: r.t.title,
      description: r.t.description,
      courseId: r.t.courseId,
      courseName: r.course.name,
      batchId: r.t.batchId,
      batchCode: r.batch?.code ?? null,
      batchName: r.batch?.name ?? null,
      durationMinutes: r.t.durationMinutes,
      attemptsAllowed: r.t.attemptsAllowed,
      startsAt: r.t.startsAt ? formatDateTime(r.t.startsAt) : null,
      endsAt: r.t.endsAt ? formatDateTime(r.t.endsAt) : null,
      status: r.t.status,
      questionCount: data.qCounts.get(r.t.id) ?? 0,
      attemptCount: data.aCounts.get(r.t.id) ?? 0,
      createdAt: formatDate(r.t.createdAt),
    }));

  // Question bank grouped by course (for the builder picker).
  const questionsByCourse: Record<string, QuestionView[]> = {};
  if (user.tutorRowId) {
    const bank = await listTutorQuestions(user.tutorRowId);
    for (const r of bank) {
      const list = questionsByCourse[r.q.courseId] ?? [];
      list.push({
        id: r.q.id,
        courseId: r.q.courseId,
        courseName: r.course.name,
        type: r.q.type,
        difficulty: r.q.difficulty,
        topic: r.q.topic,
        stem: r.q.stem,
        options: r.q.options,
        correctAnswer: r.q.correctAnswer,
        explanation: r.q.explanation,
        createdAt: formatDate(r.q.createdAt),
      });
      questionsByCourse[r.q.courseId] = list;
    }
  }

  return (
    <>
      <PageHeader
        title="Tests & Quizzes"
        description="Build tests from the question bank and grade attempts."
      />
      <TestsClient tests={views} courses={courses} questionsByCourse={questionsByCourse} />
    </>
  );
}
