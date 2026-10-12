export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { AnnouncementFeed } from "@/components/shared/announcement-feed";
import { requireUser } from "@/lib/auth/session";
import { listAnnouncementsForRole } from "@/lib/queries/comms";

export default async function StudentAnnouncementsPage() {
  const user = await requireUser("student");
  const rows = user.studentRowId
    ? await listAnnouncementsForRole("student", { studentRowId: user.studentRowId })
    : [];

  const views = rows.map(({ a, authorName, courseName, batchCode }) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    scope: a.scope,
    pinned: a.pinned,
    publishAt: a.publishAt,
    authorName,
    courseName,
    batchCode,
  }));

  return (
    <>
      <PageHeader title="Announcements" description="Updates from the centre and your tutors." />
      <AnnouncementFeed announcements={views} />
    </>
  );
}
