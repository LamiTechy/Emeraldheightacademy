export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { BatchesClient } from "@/components/admin/batches-client";
import type { BatchView, FormOptions } from "@/components/admin/types";
import { getSelectOptions, listBatches } from "@/lib/queries/admin";
import { batchStatusEnum } from "@/db/schema";

export default async function AdminBatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = batchStatusEnum.enumValues.find((s) => s === sp.status);

  const [rows, options] = await Promise.all([listBatches({ status }), getSelectOptions()]);

  const views: BatchView[] = rows.map((r) => ({
    id: r.id,
    courseId: r.courseId,
    courseName: r.course?.name ?? "—",
    courseCode: r.course?.code ?? "",
    name: r.name,
    code: r.code,
    daysOfWeek: r.daysOfWeek,
    startTime: r.startTime,
    endTime: r.endTime,
    mode: r.mode,
    room: r.room,
    capacity: r.capacity,
    startDate: r.startDate,
    endDate: r.endDate,
    status: r.status,
    tutors: r.tutorAssignments.map((ta) => ({
      tutorRowId: ta.tutor.id,
      name: ta.tutor.user.name,
      tutorId: ta.tutor.tutorId,
    })),
    enrolledCount: r.enrolledCount,
  }));

  const formOptions: FormOptions = {
    students: [],
    tutors: options.tutors,
    courses: options.courses,
    batches: options.batches,
  };

  return (
    <>
      <PageHeader
        title="Batches"
        description="Class schedules, capacity and tutor assignments."
      />
      <BatchesClient rows={views} options={formOptions} />
    </>
  );
}
