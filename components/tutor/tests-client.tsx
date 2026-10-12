"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/badges";
import { DataTable, type Column } from "@/components/tables/data-table";
import { UrlFilterSelect } from "@/components/tables/url-filter-select";
import { TestForm } from "@/components/tutor/test-form";
import type {
  AttemptAnswerView,
  AttemptView,
  QuestionView,
  TestQuestionRow,
  TestView,
} from "@/components/tutor/test-types";
import type { CourseTreeNode } from "@/components/tutor/types";
import { apiRequest } from "@/lib/client-api";
import { formatDateTime, plural } from "@/lib/format";
import {
  CheckIcon,
  ClipboardListIcon,
  LayersIcon,
  ListChecksIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

type GradingDialogData = {
  test: TestView;
  attempts: AttemptView[];
};

export function TestsClient({
  tests,
  courses,
  questionsByCourse,
}: {
  tests: TestView[];
  courses: CourseTreeNode[];
  questionsByCourse: Record<string, QuestionView[]>;
}) {
  const router = useRouter();
  const [sheet, setSheet] = React.useState<null | { mode: "create" | "edit"; test?: TestView }>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<TestView | null>(null);

  const [builder, setBuilder] = React.useState<TestView | null>(null);
  const [bank, setBank] = React.useState<TestQuestionRow[] | null>(null);
  const [picked, setPicked] = React.useState<{ questionId: string; marks: number; stem: string; type: string; topic: string }[]>([]);
  const [savingQuestions, setSavingQuestions] = React.useState(false);
  const [builderStatus, setBuilderStatus] = React.useState<string>("draft");

  const [grading, setGrading] = React.useState<GradingDialogData | null>(null);
  const [attemptsLoading, setAttemptsLoading] = React.useState(false);
  const [activeAttempt, setActiveAttempt] = React.useState<AttemptView | null>(null);
  const [answers, setAnswers] = React.useState<AttemptAnswerView[] | null>(null);
  const [scores, setScores] = React.useState<Record<string, string>>({});
  const [gradeBusy, setGradeBusy] = React.useState(false);

  async function openBuilder(test: TestView) {
    setBuilder(test);
    setBank(null);
    setPicked([]);
    try {
      const result = await apiRequest<{
        status: string;
        questions: { questionId: string; marks: number; stem: string; type: string; topic: string }[];
      }>(`/api/tutor/tests/${test.id}/questions`, { method: "GET" });
      if (result.ok && result.data) {
        setBuilderStatus(result.data.status);
        setPicked(result.data.questions);
        setBank([]);
      } else {
        toast.error(result.error ?? "Failed to load questions");
      }
    } finally {
      setBank([]);
    }
  }

  const courseQuestions = builder ? (questionsByCourse[builder.courseId] ?? []) : [];

  function addQuestion(q: QuestionView) {
    setPicked((rows) =>
      rows.some((r) => r.questionId === q.id)
        ? rows
        : [...rows, { questionId: q.id, marks: 1, stem: q.stem, type: q.type, topic: q.topic }],
    );
  }

  function removePicked(questionId: string) {
    setPicked((rows) => rows.filter((r) => r.questionId !== questionId));
  }

  function setMarks(questionId: string, marks: number) {
    setPicked((rows) => rows.map((r) => (r.questionId === questionId ? { ...r, marks } : r)));
  }

  async function saveQuestions() {
    if (!builder) return;
    setSavingQuestions(true);
    try {
      const result = await apiRequest(`/api/tutor/tests/${builder.id}/questions`, {
        method: "PUT",
        body: { questions: picked.map((p) => ({ questionId: p.questionId, marks: p.marks })) },
      });
      if (!result.ok) {
        toast.error(result.error ?? "Failed to save");
        return;
      }
      toast.success(`Saved ${picked.length} question(s)`);
      router.refresh();
    } finally {
      setSavingQuestions(false);
    }
  }

  async function setStatus(test: TestView, status: "draft" | "published" | "closed") {
    const result = await apiRequest(`/api/tutor/tests/${test.id}`, {
      method: "PATCH",
      body: { status },
    });
    if (!result.ok) {
      toast.error(result.error ?? "Failed");
      return;
    }
    toast.success(status === "published" ? "Test published" : status === "closed" ? "Test closed" : "Moved to draft");
    if (builder?.id === test.id) setBuilderStatus(status);
    router.refresh();
  }

  async function removeTest(test: TestView) {
    try {
      const result = await apiRequest(`/api/tutor/tests/${test.id}`, { method: "DELETE" });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success("Test deleted");
      router.refresh();
    } finally {
      setDeleteTarget(null);
    }
  }

  async function openAttempts(test: TestView) {
    setGrading({ test, attempts: [] });
    setAttemptsLoading(true);
    setActiveAttempt(null);
    setAnswers(null);
    try {
      const result = await apiRequest<{ attempts: AttemptView[] }>(
        `/api/tutor/tests/${test.id}/attempts`,
        { method: "GET" },
      );
      if (result.ok && result.data) {
        setGrading({ test, attempts: result.data.attempts });
      } else {
        toast.error(result.error ?? "Failed to load attempts");
      }
    } finally {
      setAttemptsLoading(false);
    }
  }

  async function openAttempt(attempt: AttemptView) {
    if (!grading) return;
    setActiveAttempt(attempt);
    setAnswers(null);
    try {
      const result = await apiRequest<{ answers: AttemptAnswerView[] }>(
        `/api/tutor/attempts/${attempt.id}/answers`,
        { method: "GET" },
      );
      if (result.ok && result.data) {
        setAnswers(result.data.answers);
        const initial: Record<string, string> = {};
        for (const a of result.data.answers) initial[a.id] = String(a.awardedMarks);
        setScores(initial);
      } else {
        toast.error(result.error ?? "Failed to load answers");
      }
    } finally {
      // nothing
    }
  }

  async function saveGrade(finalize: boolean) {
    if (!grading || !activeAttempt || !answers) return;
    setGradeBusy(true);
    try {
      const body = {
        attemptId: activeAttempt.id,
        finalize,
        answers: answers.map((a) => ({
          answerId: a.id,
          awardedMarks: Number(scores[a.id] ?? 0),
          feedback: null as string | null,
        })),
      };
      const result = await apiRequest<{ status: string; totalScore: number; maxScore: number }>(
        `/api/tutor/attempts/${activeAttempt.id}/grade`,
        { method: "POST", body },
      );
      if (!result.ok) {
        toast.error(result.error ?? "Failed to grade");
        return;
      }
      toast.success(
        `Graded — ${result.data?.totalScore ?? 0}/${result.data?.maxScore ?? 0}`,
      );
      await openAttempts(grading.test);
      router.refresh();
    } finally {
      setGradeBusy(false);
    }
  }

  const totalMarks = picked.reduce((a, p) => a + p.marks, 0);

  const columns: Column<TestView>[] = [
    {
      key: "title",
      header: "Test",
      value: (r) => `${r.title} ${r.courseName}`,
      cell: (r) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{r.title}</span>
          <span className="truncate text-xs text-muted-foreground">
            {r.courseName}
            {r.batchCode ? ` · ${r.batchCode}` : " · whole course"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      value: (r) => r.status,
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "questions",
      header: "Questions",
      value: (r) => r.questionCount,
      align: "right",
    },
    {
      key: "duration",
      header: "Duration",
      value: (r) => r.durationMinutes,
      cell: (r) => `${r.durationMinutes} min`,
    },
    {
      key: "window",
      header: "Window",
      value: (r) => r.startsAt ?? "",
      cell: (r) =>
        r.startsAt || r.endsAt ? (
          <div className="flex flex-col text-xs">
            <span>{r.startsAt ? formatDateTime(r.startsAt) : "immediate"}</span>
            <span className="text-muted-foreground">{r.endsAt ? formatDateTime(r.endsAt) : "no close"}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Always open</span>
        ),
    },
    {
      key: "attempts",
      header: "Attempts",
      value: (r) => r.attemptCount,
      cell: (r) => `${r.attemptCount} ${plural(r.attemptCount, "attempt")}`,
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <UrlFilterSelect
          param="status"
          label="Filter by status"
          options={[
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
            { value: "closed", label: "Closed" },
          ]}
          placeholder="All statuses"
        />
        <Button size="sm" className="ml-auto" onClick={() => setSheet({ mode: "create" })}>
          <PlusIcon /> New test
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={tests}
        getRowId={(r) => r.id}
        searchPlaceholder="Search tests…"
        searchValue={(r) => `${r.title} ${r.courseName} ${r.batchCode ?? ""}`}
        exportFileName="tests"
        emptyTitle="No tests match"
        actions={(r) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${r.title}`}>
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => void openBuilder(r)}>
                <LayersIcon /> Questions ({r.questionCount})
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void openAttempts(r)}>
                <ClipboardListIcon /> Attempts ({r.attemptCount})
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSheet({ mode: "edit", test: r })}>
                <PencilIcon /> Edit details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {r.status === "draft" ? (
                <DropdownMenuItem disabled={r.questionCount === 0} onSelect={() => void setStatus(r, "published")}>
                  <CheckIcon /> Publish
                </DropdownMenuItem>
              ) : null}
              {r.status === "published" ? (
                <DropdownMenuItem onSelect={() => void setStatus(r, "closed")}>
                  <ListChecksIcon /> Close
                </DropdownMenuItem>
              ) : null}
              {r.status === "closed" ? (
                <DropdownMenuItem onSelect={() => void setStatus(r, "draft")}>
                  <PencilIcon /> Reopen as draft
                </DropdownMenuItem>
              ) : null}
              {r.attemptCount === 0 ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(r)}>
                    <Trash2Icon /> Delete
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <Sheet open={sheet !== null} onOpenChange={(o) => !o && setSheet(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{sheet?.mode === "edit" ? "Edit test" : "New test"}</SheetTitle>
            <SheetDescription>
              {sheet?.mode === "edit" ? "Update test settings." : "Create a test, then add questions."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            {sheet ? (
              <TestForm
                key={sheet.test?.id ?? "new"}
                mode={sheet.mode}
                test={sheet.test}
                courses={courses}
                onDone={() => setSheet(null)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      {/* Question builder */}
      <Dialog open={builder !== null} onOpenChange={(o) => !o && setBuilder(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Questions — {builder?.title}</DialogTitle>
            <DialogDescription>
              Pick from your bank ({courseQuestions.length} available for {builder?.courseName}).{" "}
              {picked.length} selected · {totalMarks} marks total
            </DialogDescription>
          </DialogHeader>
          {bank === null ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Bank ({courseQuestions.length})</p>
                <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border p-2">
                  {courseQuestions.length === 0 ? (
                    <p className="p-2 text-sm text-muted-foreground">
                      No questions in this course&apos;s bank yet — add some first.
                    </p>
                  ) : (
                    courseQuestions.map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        className="flex w-full items-start gap-2 rounded-md p-2 text-left text-sm hover:bg-muted"
                        onClick={() => addQuestion(q)}
                        disabled={picked.some((p) => p.questionId === q.id)}
                      >
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          {q.type === "mcq" ? "MCQ" : q.type === "true_false" ? "T/F" : "SA"}
                        </Badge>
                        <span className="min-w-0 flex-1 truncate">{q.stem}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected ({picked.length})</p>
                <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border p-2">
                  {picked.length === 0 ? (
                    <p className="p-2 text-sm text-muted-foreground">Click questions to add them.</p>
                  ) : (
                    picked.map((p, i) => (
                      <div key={p.questionId} className="flex items-center gap-2 rounded-md p-2 text-sm">
                        <span className="w-5 font-mono text-xs text-muted-foreground">{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate">{p.stem}</span>
                        <Input
                          type="number"
                          min={0.5}
                          step={0.5}
                          value={p.marks}
                          onChange={(e) => setMarks(p.questionId, Number(e.target.value))}
                          className="h-7 w-16"
                          aria-label="Marks"
                        />
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => removePicked(p.questionId)}
                          aria-label="Remove"
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setBuilder(null)}>
                    Close
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void saveQuestions()}
                    disabled={savingQuestions || builderStatus !== "draft"}
                    title={builderStatus !== "draft" ? "Only draft tests can be edited" : undefined}
                  >
                    {savingQuestions ? "Saving…" : "Save questions"}
                  </Button>
                </div>
                {builderStatus !== "draft" ? (
                  <p className="text-xs text-muted-foreground">
                    Close or reopen as draft to change questions.
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Attempts + grading */}
      <Dialog open={grading !== null} onOpenChange={(o) => !o && setGrading(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Attempts — {grading?.test.title}</DialogTitle>
            <DialogDescription>
              {grading ? `${grading.attempts.length} attempt(s)` : ""}
            </DialogDescription>
          </DialogHeader>
          {attemptsLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !grading || grading.attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attempts yet.</p>
          ) : activeAttempt ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setActiveAttempt(null)}>
                  ← All attempts
                </Button>
                <span className="text-sm font-medium">
                  {activeAttempt.studentName} — attempt {activeAttempt.attemptNumber}
                </span>
                <StatusBadge status={activeAttempt.status} />
                {activeAttempt.totalScore !== null ? (
                  <span className="ml-auto text-sm">
                    {activeAttempt.totalScore}/{activeAttempt.maxScore}
                  </span>
                ) : null}
              </div>
              {!answers ? (
                <Skeleton className="h-24 w-full" />
              ) : answers.length === 0 ? (
                <p className="text-sm text-muted-foreground">The student saved no answers.</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {answers.map((a, i) => (
                      <div key={a.id} className="rounded-lg border p-3">
                        <div className="flex items-start gap-2">
                          <span className="font-mono text-xs text-muted-foreground">Q{i + 1}</span>
                          <p className="min-w-0 flex-1 text-sm font-medium">{a.stem}</p>
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            {a.type === "mcq" ? "MCQ" : a.type === "true_false" ? "T/F" : "Short"}
                          </Badge>
                        </div>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-md bg-muted/40 p-2 text-sm">
                            <p className="mb-1 text-xs text-muted-foreground">Student answer</p>
                            {a.type === "mcq" ? (
                              <p>
                                {a.answerKey
                                  ? `${a.answerKey}. ${a.options.find((o) => o.key === a.answerKey)?.text ?? ""}`
                                  : "—"}
                              </p>
                            ) : a.type === "true_false" ? (
                              <p>{a.answerValue === undefined ? "—" : a.answerValue ? "True" : "False"}</p>
                            ) : (
                              <p className="whitespace-pre-wrap">{a.answerText || "—"}</p>
                            )}
                          </div>
                          <div className="rounded-md bg-muted/20 p-2 text-sm">
                            <p className="mb-1 text-xs text-muted-foreground">Correct</p>
                            {a.type === "mcq" ? (
                              <p>
                                {a.correctAnswer.key
                                  ? `${a.correctAnswer.key}. ${a.options.find((o) => o.key === a.correctAnswer.key)?.text ?? ""}`
                                  : "—"}
                              </p>
                            ) : a.type === "true_false" ? (
                              <p>{a.correctAnswer.value ? "True" : "False"}</p>
                            ) : (
                              <p className="font-mono">{(a.correctAnswer.accepted ?? []).join(", ")}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Label className="text-xs">Marks / {a.marks}</Label>
                          <Input
                            type="number"
                            min={0}
                            max={a.marks}
                            value={scores[a.id] ?? ""}
                            onChange={(e) => setScores((s) => ({ ...s, [a.id]: e.target.value }))}
                            className="h-8 w-20"
                          />
                          {a.needsManual ? (
                            <Badge variant="outline" className="text-amber-600">
                              needs review
                            </Badge>
                          ) : null}
                          {a.isCorrect === true ? (
                            <Badge variant="outline" className="text-primary">
                              auto ✓
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" disabled={gradeBusy} onClick={() => void saveGrade(false)}>
                      Save scores
                    </Button>
                    <Button size="sm" disabled={gradeBusy} onClick={() => void saveGrade(true)}>
                      {gradeBusy ? "Saving…" : "Save & finalize"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {grading.attempts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm hover:bg-muted"
                  onClick={() => void openAttempt(a)}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{a.studentName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {a.studentCode} · attempt {a.attemptNumber} ·{" "}
                      {a.submittedAt ? formatDateTime(a.submittedAt) : "in progress"}
                    </span>
                  </span>
                  <StatusBadge status={a.status} />
                  <span className="shrink-0 text-sm">
                    {a.totalScore !== null ? `${a.totalScore}/${a.maxScore}` : "—"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this test?"
        description={`“${deleteTarget?.title}” has no attempts and can be safely removed.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (deleteTarget) void removeTest(deleteTarget); }}
      />
    </>
  );
}
