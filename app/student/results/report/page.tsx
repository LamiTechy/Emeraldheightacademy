export const instant = false;

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getCourseProgress, getStudentProfile } from "@/lib/queries/student";
import { formatDate } from "@/lib/format";
import { ArrowLeftIcon } from "lucide-react";
import { PrintButton } from "@/components/student/print-button";

export default async function StudentReportPage() {
  const user = await requireUser("student");
  const studentRowId = user.studentRowId;

  const [profile, progress] = studentRowId
    ? await Promise.all([getStudentProfile(studentRowId), getCourseProgress(studentRowId)])
    : [null, []];

  const overallTests =
    progress.filter((p) => p.testAverage !== null).length === 0
      ? null
      : Math.round(
          (progress
            .filter((p) => p.testAverage !== null)
            .reduce((a, p) => a + (p.testAverage ?? 0), 0) /
            progress.filter((p) => p.testAverage !== null).length) * 10,
        ) / 10;

  const overallAttendance =
    progress.length === 0 || progress.every((p) => p.attendanceRate === null)
      ? null
      : Math.round(
          (progress.filter((p) => p.attendanceRate !== null).reduce((a, p) => a + (p.attendanceRate ?? 0), 0) /
            progress.filter((p) => p.attendanceRate !== null).length) * 10,
        ) / 10;

  const today = new Date();

  return (
    <>
      <div className="no-print">
        <PageHeader
          title="Progress report"
          description="Print or save as PDF for your records."
        >
          <Button asChild variant="outline" size="sm">
            <Link href="/student/results">
              <ArrowLeftIcon /> Back to results
            </Link>
          </Button>
          <PrintButton />
        </PageHeader>
      </div>

      <Card className="print:shadow-none print:border-0">
        <CardContent className="space-y-6 p-8 print:p-0">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
            <div>
              <h1 className="font-heading text-2xl font-bold">Emerald Height Academy</h1>
              <p className="text-sm text-muted-foreground">Excellence in every lesson.</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold">Student Progress Report</p>
              <p className="text-muted-foreground">Issued {formatDate(today)}</p>
            </div>
          </header>

          <section className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between border-b pb-1">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{profile?.user?.name ?? user.name}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{profile?.user?.email ?? user.email}</span>
            </div>
            {profile?.studentId ? (
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Student ID</span>
                <span className="font-medium">{profile.studentId}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-b pb-1">
              <span className="text-muted-foreground">Overall attendance</span>
              <span className="font-medium">{overallAttendance === null ? "—" : `${overallAttendance}%`}</span>
            </div>
          </section>

          {progress.length === 0 ? (
            <EmptyState
              title="No enrolled courses"
              description="Enroll in a course to generate a progress report."
            />
          ) : (
            <section className="space-y-4">
              <h2 className="font-heading text-lg font-semibold">Course performance</h2>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Course</th>
                    <th className="py-2 pr-4">Batch</th>
                    <th className="py-2 pr-4 text-right">Attendance</th>
                    <th className="py-2 pr-4 text-right">Test avg</th>
                    <th className="py-2 text-right">Tests taken</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.map((p) => (
                    <tr key={p.courseId} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">
                        {p.courseName} <span className="text-muted-foreground">({p.courseCode})</span>
                      </td>
                      <td className="py-2 pr-4">{p.batches.join(", ")}</td>
                      <td className="py-2 pr-4 text-right">
                        {p.attendanceRate === null ? "—" : `${p.attendanceRate}%`}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        {p.testAverage === null ? "—" : `${p.testAverage}%`}
                      </td>
                      <td className="py-2 text-right">{p.testScores.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {progress.some((p) => p.testScores.length > 0) ? (
            <section className="space-y-3">
              <h2 className="font-heading text-lg font-semibold">Test detail</h2>
              {progress.map((p) =>
                p.testScores.length === 0 ? null : (
                  <div key={p.courseId}>
                    <p className="mb-1 text-sm font-medium">{p.courseName}</p>
                    <table className="w-full border-collapse text-sm">
                      <tbody>
                        {p.testScores.map((s, i) => (
                          <tr key={`${p.courseId}-${i}`} className="border-b last:border-0">
                            <td className="py-1.5 pr-4">{s.title}</td>
                            <td className="py-1.5 pr-4 text-muted-foreground">
                              {s.date ? formatDate(s.date) : "—"}
                            </td>
                            <td className="py-1.5 text-right">
                              {s.score}/{s.max} ({s.max === 0 ? 0 : Math.round((s.score / s.max) * 100)}%)
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ),
              )}
            </section>
          ) : null}

          <section className="flex justify-between border-t pt-4 text-sm">
            <div>
              <p className="text-muted-foreground">Overall test average</p>
              <p className="font-heading text-xl font-bold">
                {overallTests === null ? "—" : `${overallTests}%`}
              </p>
            </div>
            <div className="self-end text-right text-xs text-muted-foreground">
              <p>Signature: ______________________</p>
            </div>
          </section>
        </CardContent>
      </Card>
    </>
  );
}
