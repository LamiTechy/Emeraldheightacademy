export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { MaterialsClient } from "@/components/tutor/materials-client";
import type { MaterialView } from "@/components/tutor/types";
import { requireUser } from "@/lib/auth/session";
import { listTutorCourseTree, listTutorMaterials } from "@/lib/queries/tutor";
import { formatDate } from "@/lib/format";

export default async function TutorMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("tutor");
  const sp = await searchParams;

  const [rows, courses] = user.tutorRowId
    ? await Promise.all([listTutorMaterials(user.tutorRowId), listTutorCourseTree(user.tutorRowId)])
    : [[], []];

  const views: MaterialView[] = rows.map((r) => ({
    id: r.m.id,
    courseId: r.m.courseId,
    batchId: r.m.batchId,
    title: r.m.title,
    description: r.m.description,
    type: r.m.type,
    url: r.m.url,
    fileName: r.m.fileName,
    fileSize: r.m.fileSize,
    tags: r.m.tags ?? [],
    courseName: r.course.name,
    batchName: r.batch?.name ?? null,
    createdAt: formatDate(r.m.createdAt),
  }));

  const typeFilter = typeof sp.type === "string" ? sp.type : null;

  return (
    <>
      <PageHeader
        title="Materials"
        description="Notes, past questions, videos and links for your students."
      />
      <MaterialsClient materials={views} courses={courses} typeFilter={typeFilter} />
    </>
  );
}
