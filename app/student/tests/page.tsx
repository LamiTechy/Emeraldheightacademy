export const instant = false;

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { listStudentTests } from "@/lib/queries/tutor-tests";
import { plural } from "@/lib/format";
import { ArrowRightIcon, ClockIcon, FileTextIcon } from "lucide-react";

export default async function StudentTestsPage() {
  const user = await requireUser("student");
  const rows = user.studentRowId ? await listStudentTests(user.studentRowId) : [];

  return (
    <>
      <PageHeader
        title="Tests & Quizzes"
        description="Available tests, timers and your past attempts."
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No tests available yet"
          description="Published tests for your courses will appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map(({ test, course, batch, questionCount, attempts }) => {
            const inProgress = attempts.find((a) => a.status === "in_progress");
            const last = attempts[attempts.length - 1];
            const used = attempts.filter((a) => a.status !== "in_progress").length;
            const canAttempt = used < test.attemptsAllowed || !!inProgress;
            const result = last && last.status === "graded" && last.totalScore !== null
              ? `${Number(last.totalScore)}/${Number(last.maxScore)}`
              : null;

            return (
              <Card key={test.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary">{course.name}</Badge>
                    <StatusBadge status={test.status} />
                  </div>
                  <CardTitle className="text-base">{test.title}</CardTitle>
                  <CardDescription>
                    {batch ? `${batch.code} — ${batch.name}` : "Whole course"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  {test.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{test.description}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <FileTextIcon className="size-3.5" /> {questionCount} {plural(questionCount, "question")}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon className="size-3.5" /> {test.durationMinutes} min
                    </span>
                    <span>
                      Attempt {Math.min(used + 1, test.attemptsAllowed)}/{test.attemptsAllowed}
                    </span>
                    {result ? <span className="font-medium text-foreground">Last: {result}</span> : null}
                  </div>
                  <div className="mt-auto flex items-center justify-end gap-2 pt-1">
                    {inProgress ? (
                      <Button asChild size="sm">
                        <Link href={`/student/tests/${test.id}`}>
                          Resume attempt <ArrowRightIcon />
                        </Link>
                      </Button>
                    ) : canAttempt ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/student/tests/${test.id}`}>
                          {used > 0 ? "Try again" : "Start test"} <ArrowRightIcon />
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">No attempts left</span>
                    )}
                    {last && last.status !== "in_progress" ? (
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/student/tests/${test.id}/result`}>View result</Link>
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
