export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StudentsClient } from "@/components/tutor/students-client";
import { requireUser } from "@/lib/auth/session";
import { listTutorBatches, listTutorStudents } from "@/lib/queries/tutor";
import { plural } from "@/lib/format";
import {
  CalendarCheckIcon,
  ClipboardCheckIcon,
  GraduationCapIcon,
  UsersIcon,
} from "lucide-react";

export default async function TutorStudentsPage() {
  const user = await requireUser("tutor");
  const batchRows = user.tutorRowId ? await listTutorBatches(user.tutorRowId) : [];
  const rows = (user.tutorRowId ? await listTutorStudents(user.tutorRowId) : []).map((r) => ({
    ...r,
    enrolledAt: r.enrolledAt.toISOString(),
  }));

  const avgScores = rows.filter((r) => r.avgScore !== null).map((r) => r.avgScore as number);
  const avgTestScore = avgScores.length
    ? Math.round(avgScores.reduce((a, b) => a + b, 0) / avgScores.length)
    : null;

  const present = rows.reduce((sum, r) => sum + r.presentCount, 0);
  const sessions = rows.reduce((sum, r) => sum + r.attendanceTotal, 0);
  const attendancePct = sessions > 0 ? Math.round((present / sessions) * 100) : null;

  const submitted = rows.reduce((sum, r) => sum + r.assignmentsSubmitted, 0);
  const available = rows.reduce((sum, r) => sum + r.assignmentsAvailable, 0);

  return (
    <>
      <PageHeader title="My Students" description="Roster and progress for every student you teach." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={UsersIcon}
          label="Students"
          value={rows.length}
          hint={`Across ${batchRows.length} ${plural(batchRows.length, "batch", "batches")}`}
        />
        <StatCard
          icon={GraduationCapIcon}
          label="Avg test score"
          value={avgTestScore === null ? "—" : `${avgTestScore}%`}
          hint="Graded attempts on your tests"
        />
        <StatCard
          icon={CalendarCheckIcon}
          label="Attendance"
          value={attendancePct === null ? "—" : `${attendancePct}%`}
          hint={sessions > 0 ? `Across ${sessions} recorded ${plural(sessions, "session")}` : "No sessions marked yet"}
        />
        <StatCard
          icon={ClipboardCheckIcon}
          label="Assignments in"
          value={available > 0 ? `${submitted}/${available}` : "—"}
          hint="Submissions received"
        />
      </div>

      <StudentsClient students={rows} hasBatches={batchRows.length > 0} />
    </>
  );
}
