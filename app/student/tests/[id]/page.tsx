export const instant = false;

import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { QuizRunner, type AnswerMap } from "@/components/student/quiz-runner";
import { requireUser } from "@/lib/auth/session";
import { getTestForStudent, loadQuizPayload } from "@/lib/queries/tutor-tests";

export default async function StudentTakeTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser("student");
  const { id } = await params;
  if (!user.studentRowId) notFound();

  const test = await getTestForStudent(id, user.studentRowId);
  if (!test) notFound();

  const payload = await loadQuizPayload(test.id, user.studentRowId);
  const hasPayload = payload && !("error" in payload);

  return (
    <>
      <PageHeader title={test.title} description={test.description ?? test.course.name} />
      <QuizRunner
        testId={test.id}
        testTitle={test.title}
        questions={hasPayload ? payload.questions : null}
        initialSaved={hasPayload ? (payload.saved as AnswerMap) : {}}
        attemptId={hasPayload ? payload.attemptId : null}
        expiresAt={hasPayload ? payload.expiresAt : null}
      />
    </>
  );
}
