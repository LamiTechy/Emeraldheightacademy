export const instant = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/session";
import { loadAttemptResult } from "@/lib/queries/tutor-tests";
import { db } from "@/db";
import { attemptAnswers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatDateTime } from "@/lib/format";
import { ArrowLeftIcon } from "lucide-react";

export default async function StudentTestResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser("student");
  const { id } = await params;
  if (!user.studentRowId) notFound();

  // Latest attempt for this test.
  const attempt = await db.query.testAttempts.findFirst({
    where: (t, { and, eq: e }) =>
      and(e(t.testId, id), e(t.studentId, user.studentRowId!)),
    orderBy: (t, { desc }) => [desc(t.attemptNumber)],
  });
  if (!attempt) notFound();

  const result = await loadAttemptResult(attempt.id, user.studentRowId);
  if (!result) notFound();

  const pct =
    result.totalScore !== null && result.maxScore && result.maxScore > 0
      ? Math.round((result.totalScore / result.maxScore) * 100)
      : null;

  const answers = result.showAnswers
    ? await db.query.attemptAnswers.findMany({
        where: eq(attemptAnswers.attemptId, attempt.id),
        with: { question: true },
      })
    : [];

  return (
    <>
      <PageHeader title={result.title} description="Your result" />

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {result.status.replace("_", " ")}
            </Badge>
            {result.autoSubmitted ? (
              <Badge variant="outline" className="text-amber-600">
                auto-submitted (time up)
              </Badge>
            ) : null}
          </div>
          <CardTitle className="text-2xl">
            {result.totalScore !== null && result.maxScore !== null ? (
              <>
                {result.totalScore} / {result.maxScore}
                {pct !== null ? <span className="ml-2 text-base text-muted-foreground">({pct}%)</span> : null}
              </>
            ) : (
              <span className="text-base font-normal text-muted-foreground">
                {result.status === "submitted"
                  ? "Awaiting manual marking"
                  : "Scoring…"}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {result.submittedAt ? `Submitted ${formatDateTime(result.submittedAt)}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {answers.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">Your answers</p>
              {answers.map((a, i) => (
                <div key={a.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-xs text-muted-foreground">Q{i + 1}</span>
                    <p className="min-w-0 flex-1 font-medium">{a.question.stem}</p>
                    {a.isCorrect === true ? (
                      <Badge variant="outline" className="text-primary">
                        +{Number(a.awardedMarks)}
                      </Badge>
                    ) : a.isCorrect === false ? (
                      <Badge variant="outline" className="text-red-600">
                        0
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600">
                        pending
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="mb-0.5 text-xs text-muted-foreground">Your answer</p>
                      {a.question.type === "mcq"
                        ? (a.answer as { key?: string } | null)?.key ?? "—"
                        : a.question.type === "true_false"
                          ? (a.answer as { value?: boolean } | null)?.value
                            ? "True"
                            : "False"
                          : (a.answer as { text?: string } | null)?.text || "—"}
                    </div>
                    {a.isCorrect !== null ? (
                      <div className="rounded-md bg-brand-soft p-2 dark:bg-primary/20">
                        <p className="mb-0.5 text-xs text-primary dark:text-indigo-200">Correct</p>
                        {a.question.type === "mcq"
                          ? (a.question.correctAnswer.key ?? "—")
                          : a.question.type === "true_false"
                            ? a.question.correctAnswer.value
                              ? "True"
                              : "False"
                            : (a.question.correctAnswer.accepted ?? []).join(", ")}
                      </div>
                    ) : null}
                  </div>
                  {a.feedback ? (
                    <p className="mt-2 text-xs text-muted-foreground">Tutor: {a.feedback}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {result.status === "submitted"
                ? "Your short answers are being reviewed by your tutor — check back soon."
                : "Answers are not shown for this test."}
            </p>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href="/student/tests">
              <ArrowLeftIcon /> Back to tests
            </Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
