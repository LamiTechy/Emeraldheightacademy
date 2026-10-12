export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { CoursesClient } from "@/components/admin/courses-client";
import type { CourseView } from "@/components/admin/types";
import { listCourses } from "@/lib/queries/admin";
import { courseStatusEnum } from "@/db/schema";

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = courseStatusEnum.enumValues.find((s) => s === sp.status);

  const rows = await listCourses(status);

  const views: CourseView[] = rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    slug: r.slug,
    category: r.category,
    description: r.description,
    longDescription: r.longDescription,
    durationWeeks: r.durationWeeks,
    scheduleSummary: r.scheduleSummary,
    mode: r.mode,
    status: r.status,
    featured: r.featured,
    sortOrder: r.sortOrder,
    batchCount: r.batchCount,
  }));

  return (
    <>
      <PageHeader
        title="Courses"
        description="Every subject and programme the centre offers."
      />
      <CoursesClient rows={views} />
    </>
  );
}
