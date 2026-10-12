export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { AssignmentsClient } from "@/components/tutor/assignments-client";
import type { AssignmentView, BatchOption } from "@/components/tutor/types";
import { requireUser } from "@/lib/auth/session";
import {
  countBatchRosters,
  listTutorAssignments,
  listTutorBatches,
} from "@/lib/queries/tutor";
import { formatDateTime } from "@/lib/format";

export default async function TutorAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("tutor");
  const sp = await searchParams;

  const batchRows = user.tutorRowId ? await listTutorBatches(user.tutorRowId) : [];
  const batchIds = batchRows.map((r) => r.batch.id);
  const rosterCounts = await countBatchRosters(batchIds);
  const { rows, stats } = user.tutorRowId
    ? await listTutorAssignments(user.tutorRowId)
    : { rows: [], stats: new Map<string, { submitted: number; graded: number }>() };

  const batchFilter = typeof sp.batch === "string" ? sp.batch : null;
  const statusFilter = typeof sp.status === "string" ? sp.status : null;

  const views: AssignmentView[] = rows
    .filter((r) => !batchFilter || r.batch.id === batchFilter)
    .filter((r) => !statusFilter || r.a.status === statusFilter)
    .map((r) => {
      const s = stats.get(r.a.id);
      return {
        id: r.a.id,
        title: r.a.title,
        instructions: r.a.instructions,
        batchId: r.batch.id,
        batchCode: r.batch.code,
        batchName: r.batch.name,
        courseName: r.course.name,
        dueAt: formatDateTime(r.a.dueAt),
        points: r.a.points,
        status: r.a.status,
        attachmentUrl: r.a.attachmentUrl,
        attachmentName: r.a.attachmentName,
        submittedCount: s?.submitted ?? 0,
        gradedCount: s?.graded ?? 0,
        rosterCount: rosterCounts.get(r.batch.id) ?? 0,
        createdAt: formatDateTime(r.a.createdAt),
      };
    });

  const options: BatchOption[] = batchRows.map((r) => ({
    id: r.batch.id,
    label: `${r.batch.code} — ${r.batch.name}`,
    courseName: r.course.name,
    daysOfWeek: r.batch.daysOfWeek,
  }));

  return (
    <>
      <PageHeader
        title="Assignments"
        description="Set work, collect submissions and grade them."
      />
      <AssignmentsClient assignments={views} batches={options} />
    </>
  );
}
