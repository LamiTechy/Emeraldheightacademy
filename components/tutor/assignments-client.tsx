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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/badges";
import { DataTable, type Column } from "@/components/tables/data-table";
import { UrlFilterSelect } from "@/components/tables/url-filter-select";
import { AssignmentForm } from "@/components/tutor/assignment-form";
import type { AssignmentView, BatchOption, SubmissionView } from "@/components/tutor/types";
import { apiRequest } from "@/lib/client-api";
import { formatDateTime, formatPercent, plural } from "@/lib/format";
import {
  EyeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  Undo2Icon,
  CheckIcon,
  LockIcon,
} from "lucide-react";

export function AssignmentsClient({
  assignments,
  batches,
}: {
  assignments: AssignmentView[];
  batches: BatchOption[];
}) {
  const router = useRouter();
  const [sheet, setSheet] = React.useState<null | { mode: "create" | "edit"; assignment?: AssignmentView }>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AssignmentView | null>(null);
  const [closeTarget, setCloseTarget] = React.useState<AssignmentView | null>(null);

  const [grading, setGrading] = React.useState<AssignmentView | null>(null);
  const [subs, setSubs] = React.useState<SubmissionView[] | null>(null);
  const [subsPoints, setSubsPoints] = React.useState(100);
  const [subsLoading, setSubsLoading] = React.useState(false);
  const [subBusy, setSubBusy] = React.useState<string | null>(null);
  const [scores, setScores] = React.useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = React.useState<Record<string, string>>({});

  async function loadSubmissions(assignmentId: string) {
    setSubsLoading(true);
    setSubs(null);
    try {
      const result = await apiRequest<{ submissions: SubmissionView[]; points: number }>(
        `/api/tutor/assignments/${assignmentId}/submissions`,
        { method: "GET" },
      );
      if (!result.ok || !result.data) {
        toast.error(result.error ?? "Failed to load submissions");
        setSubs([]);
        return;
      }
      const data = result.data;
      setSubs(data.submissions);
      setSubsPoints(data.points);
      const nextScores: Record<string, string> = {};
      const nextFeedbacks: Record<string, string> = {};
      for (const s of data.submissions) {
        nextScores[s.id] = s.score !== null ? String(s.score) : "";
        nextFeedbacks[s.id] = s.feedback ?? "";
      }
      setScores(nextScores);
      setFeedbacks(nextFeedbacks);
    } finally {
      setSubsLoading(false);
    }
  }

  function openGrading(assignment: AssignmentView) {
    setGrading(assignment);
    void loadSubmissions(assignment.id);
  }

  async function grade(sub: SubmissionView, action: "grade" | "return") {
    if (!grading) return;
    const raw = scores[sub.id] ?? "";
    const score = Number(raw);
    if (raw === "" || Number.isNaN(score) || score < 0) {
      toast.error("Enter a score first");
      return;
    }
    if (score > subsPoints) {
      toast.error(`Score cannot exceed ${subsPoints} points`);
      return;
    }
    setSubBusy(sub.id);
    try {
      const result = await apiRequest(`/api/tutor/assignments/${grading.id}/grade`, {
        method: "POST",
        body: {
          submissionId: sub.id,
          score,
          feedback: feedbacks[sub.id]?.trim() ? feedbacks[sub.id].trim() : null,
          action,
        },
      });
      if (!result.ok) {
        toast.error(result.error ?? "Failed to grade");
        return;
      }
      toast.success(action === "grade" ? "Submission graded" : "Submission returned to student");
      await loadSubmissions(grading.id);
      router.refresh();
    } finally {
      setSubBusy(null);
    }
  }

  async function removeAssignment(assignment: AssignmentView) {
    try {
      const result = await apiRequest(`/api/tutor/assignments/${assignment.id}`, { method: "DELETE" });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success("Assignment deleted");
      router.refresh();
    } finally {
      setDeleteTarget(null);
    }
  }

  async function closeAssignment(assignment: AssignmentView) {
    try {
      const result = await apiRequest(`/api/tutor/assignments/${assignment.id}`, {
        method: "PATCH",
        body: { status: "closed" },
      });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success("Assignment closed");
      router.refresh();
    } finally {
      setCloseTarget(null);
    }
  }

  const columns: Column<AssignmentView>[] = [
    {
      key: "title",
      header: "Assignment",
      value: (r) => `${r.title} ${r.batchCode}`,
      cell: (r) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{r.title}</span>
          <span className="truncate text-xs text-muted-foreground">
            {r.batchCode} — {r.batchName}
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
      key: "due",
      header: "Due",
      value: (r) => r.dueAt,
      cell: (r) => (
        <span
          className={new Date(r.dueAt) < new Date() && r.status !== "closed" ? "text-red-600 dark:text-red-400" : undefined}
          title={formatDateTime(r.dueAt)}
        >
          {formatDateTime(r.dueAt)}
        </span>
      ),
    },
    {
      key: "points",
      header: "Points",
      value: (r) => r.points,
      align: "right",
    },
    {
      key: "progress",
      header: "Submissions",
      value: (r) => r.submittedCount,
      cell: (r) => (
        <div className="flex flex-col text-xs">
          <span>
            {r.submittedCount}/{r.rosterCount} {plural(r.rosterCount, "student")}
          </span>
          <span className="text-muted-foreground">
            {r.gradedCount} graded · {formatPercent(r.gradedCount, r.rosterCount)}
          </span>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <UrlFilterSelect
          param="batch"
          label="Filter by batch"
          options={batches.map((b) => ({ value: b.id, label: b.label }))}
          placeholder="All batches"
        />
        <UrlFilterSelect
          param="status"
          label="Filter by status"
          options={[
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft" },
            { value: "closed", label: "Closed" },
          ]}
          placeholder="All statuses"
        />
        <Button size="sm" className="ml-auto" onClick={() => setSheet({ mode: "create" })}>
          <PlusIcon /> New assignment
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={assignments}
        getRowId={(r) => r.id}
        searchPlaceholder="Search assignments…"
        searchValue={(r) => `${r.title} ${r.batchCode} ${r.batchName} ${r.courseName}`}
        exportFileName="assignments"
        emptyTitle="No assignments match"
        actions={(r) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${r.title}`}>
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => openGrading(r)}>
                <EyeIcon /> Submissions ({r.submittedCount})
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSheet({ mode: "edit", assignment: r })}>
                <PencilIcon /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem disabled={r.status !== "published"} onSelect={() => setCloseTarget(r)}>
                <LockIcon /> Close
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
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{sheet?.mode === "edit" ? "Edit assignment" : "New assignment"}</SheetTitle>
            <SheetDescription>
              {sheet?.mode === "edit"
                ? "Update the assignment details."
                : "Set work for one of your batches."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            {sheet ? (
              <AssignmentForm
                key={sheet.assignment?.id ?? "new"}
                mode={sheet.mode}
                assignment={sheet.assignment}
                batches={batches}
                onDone={() => setSheet(null)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={grading !== null} onOpenChange={(o) => !o && setGrading(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submissions — {grading?.title}</DialogTitle>
            <DialogDescription>
              {grading ? `${grading.submittedCount} of ${grading.rosterCount} submitted · max ${subsPoints} points` : ""}
            </DialogDescription>
          </DialogHeader>
          {subsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : !subs || subs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          ) : (
            <div className="space-y-4">
              {subs.map((sub) => (
                <div key={sub.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{sub.studentName}</span>
                    <span className="font-mono text-xs text-muted-foreground">{sub.studentCode}</span>
                    <StatusBadge status={sub.status} />
                    <span className="ml-auto text-xs text-muted-foreground">
                      Submitted {sub.submittedAt}
                    </span>
                  </div>
                  {sub.content ? (
                    <p className="mt-2 whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm">
                      {sub.content}
                    </p>
                  ) : null}
                  {sub.fileUrl ? (
                    <a
                      href={sub.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm text-blue-600 underline dark:text-blue-400"
                    >
                      {sub.fileName ?? "Open attachment"}
                    </a>
                  ) : null}
                  <div className="mt-3 grid gap-3 sm:grid-cols-[7rem_1fr]">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Score / {subsPoints}</Label>
                      <Input
                        type="number"
                        min={0}
                        max={subsPoints}
                        value={scores[sub.id] ?? ""}
                        onChange={(e) => setScores((s) => ({ ...s, [sub.id]: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Feedback</Label>
                      <Textarea
                        rows={2}
                        value={feedbacks[sub.id] ?? ""}
                        onChange={(e) => setFeedbacks((f) => ({ ...f, [sub.id]: e.target.value }))}
                        placeholder="Optional feedback for the student…"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={subBusy === sub.id}
                      onClick={() => void grade(sub, "return")}
                    >
                      <Undo2Icon /> Return
                    </Button>
                    <Button size="sm" disabled={subBusy === sub.id} onClick={() => void grade(sub, "grade")}>
                      <CheckIcon /> {subBusy === sub.id ? "Saving…" : "Grade"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this assignment?"
        description={`“${deleteTarget?.title}” and its submissions will be permanently removed.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (deleteTarget) void removeAssignment(deleteTarget); }}
      />

      <ConfirmDialog
        open={closeTarget !== null}
        onOpenChange={(o) => !o && setCloseTarget(null)}
        title="Close this assignment?"
        description={`Students will no longer be able to submit work for “${closeTarget?.title}”. Existing submissions are kept.`}
        confirmLabel="Close"
        onConfirm={() => { if (closeTarget) void closeAssignment(closeTarget); }}
      />
    </>
  );
}
