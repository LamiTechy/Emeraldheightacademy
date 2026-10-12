export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { QuestionsClient } from "@/components/tutor/questions-client";
import type { QuestionView } from "@/components/tutor/test-types";
import { requireUser } from "@/lib/auth/session";
import { listTutorQuestions } from "@/lib/queries/tutor-tests";
import { listTutorCourseTree } from "@/lib/queries/tutor";
import { formatDate } from "@/lib/format";

export default async function TutorQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("tutor");
  const sp = await searchParams;
  const courseFilter = typeof sp.course === "string" ? sp.course : null;

  const [rows, courses] = user.tutorRowId
    ? await Promise.all([
        listTutorQuestions(user.tutorRowId, courseFilter),
        listTutorCourseTree(user.tutorRowId),
      ])
    : [[], []];

  const views: QuestionView[] = rows.map((r) => ({
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
  }));

  return (
    <>
      <PageHeader
        title="Question Bank"
        description="Reusable questions for your tests and quizzes."
      />
      <QuestionsClient questions={views} courses={courses} courseFilter={courseFilter} />
    </>
  );
}
