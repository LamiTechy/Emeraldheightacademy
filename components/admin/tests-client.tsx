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
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/badges";
import { StatCard } from "@/components/shared/stat-card";
import { DataTable, type Column } from "@/components/tables/data-table";
import { UrlFilterSelect } from "@/components/tables/url-filter-select";
import type { AttemptView } from "@/components/tutor/test-types";
import { apiRequest } from "@/lib/client-api";
import { plural } from "@/lib/format";
import {
  CheckIcon,
  ClipboardListIcon,
  ListChecksIcon,
  MoreHorizontalIcon,
  PencilIcon,
} from "lucide-react";

export type AdminTestView = {
  id: string;
  title: string;
  courseName: string;
  batchCode: string | null;
  batchName: string | null;
  tutorName: string;
  status: string;
  questionCount: number;
  attemptCount: number;
  durationMinutes: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

export type AdminTestStats = {
  total: number;
  draft: number;
  published: number;
  closed: number;
  attempts: number;
};

export function TestsClient({ tests, stats }: { tests: AdminTestView[]; stats: AdminTestStats }) {
  const router = useRouter();
  const [attemptsFor, setAttemptsFor] = React.useState<AdminTestView | null>(null);
  const [attempts, setAttempts] = React.useState<AttemptView[]>([]);
  const [attemptsLoading, setAttemptsLoading] = React.useState(false);

  async function setStatus(test: AdminTestView, status: "draft" | "published" | "closed") {
    const result = await apiRequest(`/api/admin/tests/${test.id}`, {
      method: "PATCH",
      body: { status },
    });
    if (!result.ok) {
      toast.error(result.error ?? "Failed to update test");
      return;
    }
    toast.success(
      status === "published" ? "Test published" : status === "closed" ? "Test closed" : "Moved to draft",
    );
    router.refresh();
  }

  async function openAttempts(test: AdminTestView) {
    setAttemptsFor(test);
    setAttempts([]);
    setAttemptsLoading(true);
    try {
      const result = await apiRequest<{ attempts: AttemptView[] }>(
        `/api/admin/tests/${test.id}/attempts`,
        { method: "GET" },
      );
      if (result.ok && result.data) {
        setAttempts(result.data.attempts);
      } else {
        toast.error(result.error ?? "Failed to load attempts");
        setAttemptsFor(null);
      }
    } finally {
      setAttemptsLoading(false);
    }
  }

  const columns: Column<AdminTestView>[] = [
    {
      key: "title",
      header: "Test",
      value: (r) => `${r.title} ${r.courseName} ${r.tutorName}`,
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
      key: "tutor",
      header: "Tutor",
      value: (r) => r.tutorName,
      cell: (r) => <span className="truncate">{r.tutorName}</span>,
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
      key: "attempts",
      header: "Attempts",
      value: (r) => r.attemptCount,
      cell: (r) => `${r.attemptCount} ${plural(r.attemptCount, "attempt")}`,
      align: "right",
    },
    {
      key: "window",
      header: "Window",
      value: (r) => r.startsAt ?? "",
      cell: (r) =>
        r.startsAt || r.endsAt ? (
          <div className="flex flex-col text-xs">
            <span>{r.startsAt ?? "immediate"}</span>
            <span className="text-muted-foreground">{r.endsAt ?? "no close"}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Always open</span>
        ),
    },
    {
      key: "created",
      header: "Created",
      value: (r) => r.createdAt,
      cell: (r) => <span className="text-xs text-muted-foreground">{r.createdAt}</span>,
    },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ListChecksIcon} label="Total tests" value={stats.total} hint={`${stats.closed} closed`} />
        <StatCard
          icon={CheckIcon}
          label="Published"
          value={stats.published}
          hint="Visible to students now"
        />
        <StatCard
          icon={PencilIcon}
          label="Drafts"
          value={stats.draft}
          hint="Hidden from students"
        />
        <StatCard
          icon={ClipboardListIcon}
          label="Attempts"
          value={stats.attempts}
          hint="All student attempts"
        />
      </div>

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
      </div>

      <DataTable
        columns={columns}
        data={tests}
        getRowId={(r) => r.id}
        searchPlaceholder="Search tests, tutors…"
        searchValue={(r) => `${r.title} ${r.courseName} ${r.tutorName} ${r.batchCode ?? ""}`}
        exportFileName="tests"
        emptyTitle="No tests match"
        actions={(r) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${r.title}`}>
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={() => void openAttempts(r)}>
                <ClipboardListIcon /> Review attempts ({r.attemptCount})
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {r.status === "draft" ? (
                <DropdownMenuItem
                  disabled={r.questionCount === 0}
                  title={r.questionCount === 0 ? "Add questions before publishing" : undefined}
                  onSelect={() => void setStatus(r, "published")}
                >
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
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <Dialog open={attemptsFor !== null} onOpenChange={(o) => !o && setAttemptsFor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Attempts — {attemptsFor?.title}</DialogTitle>
            <DialogDescription>
              {attemptsFor
                ? attemptsLoading
                  ? `${attemptsFor.tutorName} · ${attemptsFor.courseName}`
                  : `${attemptsFor.tutorName} · ${attemptsFor.courseName} · ${attempts.length} attempt(s)`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {attemptsLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attempts yet.</p>
          ) : (
            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {attempts.map((a) => (
                <div key={a.id} className="flex w-full items-center gap-3 rounded-md border p-3 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{a.studentName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {a.studentCode} · attempt {a.attemptNumber} ·{" "}
                      {a.submittedAt ?? (a.status === "in_progress" ? "in progress" : "—")} ·{" "}
                      {a.tabSwitchCount} {plural(a.tabSwitchCount, "tab switch")}
                    </span>
                  </span>
                  <StatusBadge status={a.status} />
                  <span className="shrink-0 text-sm">
                    {a.totalScore !== null ? `${a.totalScore}/${a.maxScore}` : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
