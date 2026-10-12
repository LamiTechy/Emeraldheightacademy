export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { EnrollmentsClient } from "@/components/admin/enrollments-client";
import type { EnrollmentView, FormOptions } from "@/components/admin/types";
import { getSelectOptions, listEnrollments } from "@/lib/queries/admin";
import { enrollmentStatusEnum } from "@/db/schema";

export default async function AdminEnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string; status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const status = enrollmentStatusEnum.enumValues.find((s) => s === sp.status);
  const batchId = sp.batch && sp.batch.length === 36 ? sp.batch : undefined;
  const q = sp.q?.slice(0, 60);

  const [rows, options] = await Promise.all([
    listEnrollments({ batchId, status, q }),
    getSelectOptions(),
  ]);

  const views: EnrollmentView[] = rows.map((r) => ({
    id: r.id,
    studentUserId: r.student.user.id,
    studentRowId: r.student.id,
    studentName: r.student.user.name,
    studentEmail: r.student.user.email,
    studentCode: r.student.studentId,
    batchId: r.batch.id,
    batchCode: r.batch.code,
    batchName: r.batch.name,
    courseName: r.batch.course?.name ?? "—",
    status: r.status,
    enrolledAt: r.enrolledAt?.toISOString() ?? null,
    notes: r.notes,
  }));

  const options2: FormOptions = {
    students: options.students,
    tutors: [],
    courses: options.courses,
    batches: options.batches,
  };

  const batchFilterOptions = options.batches.map((b) => ({
    value: b.id,
    label: `${b.name} (${b.code})`,
  }));

  return (
    <>
      <PageHeader
        title="Enrollments"
        description="Which students are placed into which batches."
      />
      <EnrollmentsClient rows={views} options={options2} batchFilterOptions={batchFilterOptions} />
    </>
  );
}
