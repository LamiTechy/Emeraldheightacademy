export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/session";
import { listAnnouncementsForRole, listTutorScopeOptions } from "@/lib/queries/comms";
import { TutorAnnouncementsClient } from "@/components/tutor/tutor-announcements-client";

export default async function TutorAnnouncementsPage() {
  const user = await requireUser("tutor");
  const tutorRowId = user.tutorRowId;

  const [rows, options] = tutorRowId
    ? await Promise.all([listAnnouncementsForRole("tutor"), listTutorScopeOptions(tutorRowId)])
    : [[], []];

  const views = rows.map(({ a, authorName, courseName, batchCode }) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    scope: a.scope,
    audienceRole: a.audienceRole,
    pinned: a.pinned,
    publishAt: a.publishAt,
    authorName,
    courseName,
    batchCode,
  }));

  const optionViews = options.map(({ batch, course }) => ({
    batch: { id: batch.id, code: batch.code, name: batch.name },
    course: { id: course.id, name: course.name, code: course.code },
  }));

  return (
    <>
      <PageHeader title="Announcements" description="Post updates to your students." />
      <TutorAnnouncementsClient announcements={views} options={optionViews} />
    </>
  );
}
