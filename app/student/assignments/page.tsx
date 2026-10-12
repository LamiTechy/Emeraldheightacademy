export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { AssignmentsClient } from "@/components/student/assignments-client";
import { requireUser } from "@/lib/auth/session";
import { listStudentAssignments } from "@/lib/queries/student";

export default async function StudentAssignmentsPage() {
  const user = await requireUser("student");
  const rows = user.studentRowId ? await listStudentAssignments(user.studentRowId) : [];

  const views = rows.map(({ assignment, batch, course, submission }) => ({
    id: assignment.id,
    title: assignment.title,
    instructions: assignment.instructions,
    dueAt: assignment.dueAt,
    points: assignment.points,
    attachmentUrl: assignment.attachmentUrl,
    attachmentName: assignment.attachmentName,
    batchCode: batch.code,
    courseName: course.name,
    status: assignment.status,
    submission: submission
      ? {
          id: submission.id,
          status: submission.status,
          score: submission.score,
          feedback: submission.feedback,
          content: submission.content,
          fileUrl: submission.fileUrl,
          fileName: submission.fileName,
          submittedAt: submission.submittedAt,
        }
      : null,
  }));

  return (
    <>
      <PageHeader title="Assignments" description="Assigned work, due dates and your submissions." />
      <AssignmentsClient assignments={views} />
    </>
  );
}
