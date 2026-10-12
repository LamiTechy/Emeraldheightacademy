export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { AnnouncementsClient } from "@/components/admin/announcements-client";
import { requireUser } from "@/lib/auth/session";
import { listAllAnnouncements, listScopeOptions } from "@/lib/queries/comms";

export default async function AdminAnnouncementsPage() {
  await requireUser("admin");
  const [rows, options] = await Promise.all([listAllAnnouncements(), listScopeOptions()]);

  const views = rows.map(({ a, authorName, courseName, batchCode }) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    scope: a.scope,
    audienceRole: a.audienceRole,
    courseId: a.courseId,
    batchId: a.batchId,
    pinned: a.pinned,
    publishAt: a.publishAt,
    authorName,
    courseName,
    batchCode,
  }));

  return (
    <>
      <PageHeader title="Announcements" description="Broadcast updates to students and tutors." />
      <AnnouncementsClient
        announcements={views}
        options={{
          courses: options.courses.map((c) => ({ id: c.id, name: c.name, code: c.code })),
          batches: options.batches.map(({ batch, course }) => ({
            batch: { id: batch.id, code: batch.code, name: batch.name },
            course: { id: course.id, name: course.name },
          })),
        }}
      />
    </>
  );
}
