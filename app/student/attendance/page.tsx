export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getAttendanceSummary, listAttendanceHistory } from "@/lib/queries/student";
import { formatDate } from "@/lib/format";
import { CalendarCheckIcon, CheckCircleIcon, CalendarIcon } from "lucide-react";

export default async function StudentAttendancePage() {
  const user = await requireUser("student");
  const studentRowId = user.studentRowId;

  const [summary, history] = studentRowId
    ? await Promise.all([getAttendanceSummary(studentRowId), listAttendanceHistory(studentRowId)])
    : [{ batches: [], present: 0, total: 0, overallRate: null }, []];

  return (
    <>
      <PageHeader title="Attendance" description="Your attendance record per batch." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={CalendarCheckIcon}
          label="Overall attendance"
          value={summary.overallRate === null ? "—" : `${summary.overallRate}%`}
          hint="Late counts towards attendance"
        />
        <StatCard
          icon={CheckCircleIcon}
          label="Sessions present"
          value={summary.present}
          hint="Out of all marked sessions"
        />
        <StatCard
          icon={CalendarIcon}
          label="Sessions marked"
          value={summary.total}
          hint="Present, late & absent"
        />
      </div>

      {summary.batches.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {summary.batches.map((b) => (
            <Card key={b.batchId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{b.courseName}</CardTitle>
                <CardDescription>
                  {b.batchCode} — {b.batchName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Attendance</span>
                  <span className="font-heading text-xl font-bold">{b.rate}%</span>
                </div>
                <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                  <span>Present: {b.present}</span>
                  <span>Late: {b.late}</span>
                  <span>Absent: {b.absent}</span>
                  <span>Excused: {b.excused}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Most recent marked sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <EmptyState
              title="No attendance recorded yet"
              description="Your tutors mark attendance after each class."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{formatDate(row.day)}</TableCell>
                    <TableCell>{row.courseName}</TableCell>
                    <TableCell>{row.batchCode}</TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.notes ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
