"use client";

import { DataTable, type Column } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import type { TutorStudentView } from "@/components/tutor/types";
import { formatDate } from "@/lib/format";

function attendancePct(r: TutorStudentView): number | null {
  return r.attendanceTotal > 0 ? Math.round((r.presentCount / r.attendanceTotal) * 100) : null;
}

export function StudentsClient({
  students,
  hasBatches,
}: {
  students: TutorStudentView[];
  hasBatches: boolean;
}) {
  const columns: Column<TutorStudentView>[] = [
    {
      key: "name",
      header: "Student",
      value: (r) => r.name,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{r.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {r.studentCode} · {r.email}
          </p>
        </div>
      ),
    },
    {
      key: "batches",
      header: "Batches",
      value: (r) => r.batches.map((b) => `${b.code} ${b.name}`).join(", "),
      cell: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.batches.map((b) => (
            <Badge key={b.code} variant="secondary" className="text-xs font-normal">
              {b.code}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "tests",
      header: "My tests",
      value: (r) => r.avgScore ?? -1,
      align: "right",
      cell: (r) =>
        r.avgScore === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className="font-medium">
            {Math.round(r.avgScore)}%
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              ({r.gradedAttempts})
            </span>
          </span>
        ),
    },
    {
      key: "assignments",
      header: "Assignments",
      value: (r) => r.assignmentsSubmitted,
      align: "right",
      cell: (r) =>
        r.assignmentsAvailable === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span>
            {r.assignmentsSubmitted}
            <span className="text-muted-foreground">/{r.assignmentsAvailable}</span>
          </span>
        ),
    },
    {
      key: "attendance",
      header: "Attendance",
      value: (r) => attendancePct(r) ?? -1,
      align: "right",
      cell: (r) => {
        const pct = attendancePct(r);
        return pct === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <Badge
            variant={pct >= 75 ? "secondary" : "outline"}
            className={pct >= 75 ? "text-xs font-medium" : "border-warn/40 text-warn text-xs font-medium"}
          >
            {pct}%
          </Badge>
        );
      },
    },
    {
      key: "enrolled",
      header: "Enrolled",
      value: (r) => r.enrolledAt,
      cell: (r) => <span className="text-muted-foreground">{formatDate(r.enrolledAt)}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={students}
      getRowId={(r) => r.studentId}
      searchPlaceholder="Search students…"
      searchValue={(r) => `${r.name} ${r.email} ${r.studentCode} ${r.batches.map((b) => `${b.code} ${b.name}`).join(" ")}`}
      exportFileName="my-students"
      emptyTitle={hasBatches ? "No students yet" : "No batches assigned"}
      emptyDescription={
        hasBatches
          ? "Students appear here once they are actively enrolled in your batches."
          : "You have no batches yet — ask the admin to assign you to one."
      }
    />
  );
}
