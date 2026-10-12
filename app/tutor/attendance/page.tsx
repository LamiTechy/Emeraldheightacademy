export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { AttendanceClient } from "@/components/tutor/attendance-client";
import { requireUser } from "@/lib/auth/session";
import { listAttendanceForDay, listBatchRoster, listTutorBatches } from "@/lib/queries/tutor";
import { pad } from "@/lib/format";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`;
}

export default async function TutorAttendancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("tutor");
  const sp = await searchParams;

  const batchRows = user.tutorRowId ? await listTutorBatches(user.tutorRowId) : [];
  const options = batchRows.map((r) => ({
    id: r.batch.id,
    label: `${r.batch.code} — ${r.batch.name}`,
    courseName: r.course.name,
    daysOfWeek: r.batch.daysOfWeek,
  }));

  const wanted = typeof sp.batch === "string" ? sp.batch : null;
  const selectedId =
    wanted && options.some((b) => b.id === wanted) ? wanted : (options[0]?.id ?? null);

  const day =
    typeof sp.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.day) ? sp.day : todayIso();

  const roster = selectedId ? await listBatchRoster(selectedId) : [];
  const existing = selectedId ? await listAttendanceForDay(selectedId, day) : [];

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Mark and review attendance for your batches."
      />
      <AttendanceClient
        key={`${selectedId ?? "none"}-${day}`}
        batches={options}
        roster={roster.map((r) => ({
          studentId: r.studentId,
          studentCode: r.studentCode,
          name: r.name,
          email: r.email,
        }))}
        existing={existing.map((e) => ({
          studentId: e.studentId,
          status: e.status,
          notes: e.notes,
        }))}
        selectedBatchId={selectedId}
        day={day}
      />
    </>
  );
}
