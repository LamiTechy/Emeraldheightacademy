export const instant = false;

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { CourseAverageChart, ScoreTrendChart } from "@/components/charts/score-charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth/session";
import { getCourseProgress, listStudentResults } from "@/lib/queries/student";
import { formatDate } from "@/lib/format";
import { AwardIcon, PrinterIcon, TrendingUpIcon } from "lucide-react";

export default async function StudentResultsPage() {
  const user = await requireUser("student");
  const studentRowId = user.studentRowId;

  const [results, progress] = studentRowId
    ? await Promise.all([listStudentResults(studentRowId), getCourseProgress(studentRowId)])
    : [[], []];

  const graded = results.filter((r) => r.a.totalScore !== null);
  const best =
    graded.length === 0
      ? null
      : Math.max(
          ...graded.map((r) =>
            r.a.maxScore && Number(r.a.maxScore) > 0
              ? (Number(r.a.totalScore!) / Number(r.a.maxScore)) * 100
              : 0,
          ),
        );
  const avg =
    graded.length === 0
      ? null
      : Math.round(
          (graded.reduce(
            (acc, r) =>
              acc +
              (r.a.maxScore && Number(r.a.maxScore) > 0
                ? (Number(r.a.totalScore!) / Number(r.a.maxScore)) * 100
                : 0),
            0,
          ) /
            graded.length) * 10,
        ) / 10;

  const trend = graded
    .slice()
    .reverse()
    .map((r) => ({
      label: r.t.title,
      score: Number(r.a.totalScore ?? 0),
      max: Number(r.a.maxScore ?? 100),
    }));

  return (
    <>
      <PageHeader
        title="Results"
        description="Scores across tests and assignments, with your progress report."
      >
        <Button asChild size="sm" variant="outline">
          <Link href="/student/results/report">
            <PrinterIcon /> Progress report
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={AwardIcon}
          label="Tests graded"
          value={graded.length}
          hint="Auto & tutor graded"
        />
        <StatCard
          icon={TrendingUpIcon}
          label="Average score"
          value={avg === null ? "—" : `${avg}%`}
          hint="Across graded tests"
        />
        <StatCard
          icon={AwardIcon}
          label="Best score"
          value={best === null ? "—" : `${Math.round(best)}%`}
          hint="Highest single test"
        />
      </div>

      {trend.length > 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Score trend</CardTitle>
            <CardDescription>Percentage per graded test, oldest first</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreTrendChart points={trend} />
          </CardContent>
        </Card>
      ) : null}

      {progress.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Course averages</CardTitle>
            <CardDescription>Test average per enrolled course</CardDescription>
          </CardHeader>
          <CardContent>
            <CourseAverageChart
              points={progress.map((p) => ({ label: p.courseCode, value: p.testAverage }))}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Test results</CardTitle>
          <CardDescription>All submitted attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <EmptyState
              title="No results yet"
              description="Take a test and it will appear here once graded."
              action={{ label: "Go to tests", href: "/student/tests" }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => {
                  const max = r.a.maxScore !== null ? Number(r.a.maxScore) : null;
                  const score = r.a.totalScore !== null ? Number(r.a.totalScore) : null;
                  const pct = max && score !== null ? Math.round((score / max) * 100) : null;
                  return (
                    <TableRow key={r.a.id}>
                      <TableCell className="font-medium">{r.t.title}</TableCell>
                      <TableCell>{r.course.name}</TableCell>
                      <TableCell>
                        {r.a.submittedAt ? formatDate(r.a.submittedAt) : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.a.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {score !== null && max !== null ? `${score}/${max}` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {pct !== null ? `${pct}%` : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
