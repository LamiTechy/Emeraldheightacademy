export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { TimetableClient } from "@/components/admin/timetable-client";
import type { FormOptions, SlotView } from "@/components/admin/types";
import { getSelectOptions, listSlots } from "@/lib/queries/admin";

export default async function AdminTimetablePage() {
  const [rows, options] = await Promise.all([listSlots(), getSelectOptions()]);

  const views: SlotView[] = rows.map((r) => ({
    id: r.id,
    batchId: r.batch.id,
    batchCode: r.batch.code,
    batchName: r.batch.name,
    courseName: r.batch.course?.name ?? "—",
    tutorRowId: r.tutor.id,
    tutorName: r.tutor.user.name,
    tutorCode: r.tutor.tutorId,
    dayOfWeek: r.dayOfWeek,
    startTime: r.startTime,
    endTime: r.endTime,
    room: r.room,
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
        title="Timetable"
        description="Weekly teaching schedule across every batch and classroom."
      />
      <TimetableClient rows={views} options={formOptions} />
    </>
  );
}
