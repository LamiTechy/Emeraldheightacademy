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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type Column } from "@/components/tables/data-table";
import { UrlFilterSelect } from "@/components/tables/url-filter-select";
import { QuestionForm } from "@/components/tutor/question-form";
import type { QuestionView } from "@/components/tutor/test-types";
import type { CourseTreeNode } from "@/components/tutor/types";
import { apiRequest } from "@/lib/client-api";
import { formatDate } from "@/lib/format";
import { EyeIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

const titleize = (v: string) => v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function QuestionsClient({
  questions,
  courses,
  courseFilter,
}: {
  questions: QuestionView[];
  courses: CourseTreeNode[];
  courseFilter: string | null;
}) {
  const router = useRouter();
  const [sheet, setSheet] = React.useState<null | { mode: "create" | "edit"; question?: QuestionView }>(null);
  const [viewing, setViewing] = React.useState<QuestionView | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<QuestionView | null>(null);

  async function removeQuestion(q: QuestionView) {
    try {
      const result = await apiRequest(`/api/tutor/questions/${q.id}`, { method: "DELETE" });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success("Question deleted");
      router.refresh();
    } finally {
      setDeleteTarget(null);
    }
  }

  function answerSummary(q: QuestionView): string {
    if (q.type === "mcq") {
      const correct = q.options.find((o) => o.key === q.correctAnswer.key);
      return correct ? `${correct.key}. ${correct.text}` : "—";
    }
    if (q.type === "true_false") return q.correctAnswer.value ? "True" : "False";
    return (q.correctAnswer.accepted ?? []).join(", ") || "—";
  }

  const columns: Column<QuestionView>[] = [
    {
      key: "stem",
      header: "Question",
      value: (r) => `${r.stem} ${r.topic}`,
      cell: (r) => (
        <div className="flex max-w-md min-w-0 flex-col">
          <span className="truncate font-medium">{r.stem}</span>
          <span className="truncate text-xs text-muted-foreground">{r.topic}</span>
        </div>
      ),
    },
    {
      key: "course",
      header: "Course",
      value: (r) => r.courseName,
      cell: (r) => r.courseName,
    },
    {
      key: "type",
      header: "Type",
      value: (r) => r.type,
      cell: (r) => <Badge variant="secondary">{titleize(r.type)}</Badge>,
    },
    {
      key: "difficulty",
      header: "Difficulty",
      value: (r) => r.difficulty,
      cell: (r) => <span className="capitalize">{r.difficulty}</span>,
    },
    {
      key: "answer",
      header: "Answer",
      value: (r) => answerSummary(r),
      cell: (r) => <span className="block max-w-40 truncate text-sm">{answerSummary(r)}</span>,
    },
    {
      key: "created",
      header: "Added",
      value: (r) => r.createdAt,
      cell: (r) => formatDate(r.createdAt),
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <UrlFilterSelect
          param="course"
          label="Filter by course"
          options={courses.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="All courses"
        />
        <Button size="sm" className="ml-auto" onClick={() => setSheet({ mode: "create" })}>
          <PlusIcon /> New question
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={questions}
        getRowId={(r) => r.id}
        searchPlaceholder="Search stems or topics…"
        searchValue={(r) => `${r.stem} ${r.topic} ${r.courseName}`}
        exportFileName="question-bank"
        emptyTitle={courseFilter ? "No questions for this course" : "No questions yet"}
        actions={(r) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for question`}>
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={() => setViewing(r)}>
                <EyeIcon /> View
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSheet({ mode: "edit", question: r })}>
                <PencilIcon /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(r)}>
                <Trash2Icon /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <Sheet open={sheet !== null} onOpenChange={(o) => !o && setSheet(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{sheet?.mode === "edit" ? "Edit question" : "New question"}</SheetTitle>
            <SheetDescription>
              {sheet?.mode === "edit"
                ? "Update this bank question."
                : "Add a question to your reusable bank."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            {sheet ? (
              <QuestionForm
                key={sheet.question?.id ?? "new"}
                mode={sheet.mode}
                question={sheet.question}
                courses={courses}
                onDone={() => setSheet(null)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={viewing !== null} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewing?.topic}</DialogTitle>
            <DialogDescription>
              {viewing ? `${titleize(viewing.type)} · ${viewing.difficulty} · ${viewing.courseName}` : ""}
            </DialogDescription>
          </DialogHeader>
          {viewing ? (
            <div className="space-y-3 text-sm">
              <p className="whitespace-pre-wrap font-medium">{viewing.stem}</p>
              {viewing.type === "mcq" ? (
                <ul className="space-y-1">
                  {viewing.options.map((o) => (
                    <li
                      key={o.key}
                      className={
                        o.key === viewing.correctAnswer.key
                          ? "rounded-md bg-brand-soft px-2 py-1 font-medium text-primary dark:bg-primary/20 dark:text-indigo-200"
                          : "px-2 py-1"
                      }
                    >
                      <span className="mr-2 font-mono">{o.key}.</span>
                      {o.text}
                    </li>
                  ))}
                </ul>
              ) : null}
              {viewing.type === "true_false" ? (
                <p>
                  Correct:{" "}
                  <Badge variant="outline">{viewing.correctAnswer.value ? "True" : "False"}</Badge>
                </p>
              ) : null}
              {viewing.type === "short_answer" ? (
                <p>
                  Accepted:{" "}
                  <span className="font-mono">{(viewing.correctAnswer.accepted ?? []).join(", ")}</span>
                </p>
              ) : null}
              {viewing.explanation ? (
                <p className="rounded-md bg-muted/40 p-3 text-muted-foreground">{viewing.explanation}</p>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this question?"
        description="It will be removed from the bank and any draft tests. Questions used in attempted tests cannot be deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (deleteTarget) void removeQuestion(deleteTarget); }}
      />
    </>
  );
}
