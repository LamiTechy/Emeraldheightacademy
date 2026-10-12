"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ModeBadge, StatusBadge } from "@/components/shared/badges";
import { DataTable, type Column } from "@/components/tables/data-table";
import { UrlFilterSelect } from "@/components/tables/url-filter-select";
import { BatchForm } from "@/components/admin/batch-form";
import type { BatchView, FormOptions } from "@/components/admin/types";
import { apiRequest } from "@/lib/client-api";
import { formatDate, formatDays, shortTime } from "@/lib/format";
import { MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

export function BatchesClient({
  rows,
  options,
}: {
  rows: BatchView[];
  options: FormOptions;
}) {
  const router = useRouter();
  const [sheet, setSheet] = React.useState<null | { mode: "create" | "edit"; batch?: BatchView }>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = React.useState<BatchView | null>(null);

  async function removeBatch(batch: BatchView) {
    try {
      const result = await apiRequest(`/api/admin/batches/${batch.id}`, { method: "DELETE" });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success("Batch deleted");
      router.refresh();
    } finally {
      setDeleteTarget(null);
    }
  }

  const columns: Column<BatchView>[] = [
    {
      key: "name",
      header: "Batch",
      value: (r) => `${r.name} ${r.code}`,
      cell: (r) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{r.name}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {r.code} · {r.courseName}
          </span>
        </div>
      ),
    },
    {
      key: "tutors",
      header: "Tutors",
      value: (r) => r.tutors.map((t) => t.name).join(", "),
      cell: (r) =>
        r.tutors.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <div className="flex flex-col text-sm">
            {r.tutors.map((t) => (
              <span key={t.tutorRowId}>{t.name}</span>
            ))}
          </div>
        ),
    },
    {
      key: "schedule",
      header: "Schedule",
      value: (r) => `${formatDays(r.daysOfWeek)} ${shortTime(r.startTime)}`,
      cell: (r) => (
        <div className="flex flex-col text-sm">
          <span>{formatDays(r.daysOfWeek)}</span>
          <span className="text-xs text-muted-foreground">
            {shortTime(r.startTime)}–{shortTime(r.endTime)}
          </span>
        </div>
      ),
    },
    { key: "mode", header: "Mode", value: (r) => r.mode, cell: (r) => <ModeBadge mode={r.mode as never} /> },
    {
      key: "enrolled",
      header: "Enrolled",
      value: (r) => r.enrolledCount,
      cell: (r) => (
        <div className="min-w-24">
          <div className="mb-1 text-xs font-medium">
            {r.enrolledCount} / {r.capacity}
          </div>
          <Progress value={(r.enrolledCount / r.capacity) * 100} className="h-1.5" />
        </div>
      ),
    },
    {
      key: "dates",
      header: "Runs",
      value: (r) => r.startDate,
      cell: (r) => (
        <div className="flex flex-col text-sm">
          <span>{formatDate(r.startDate)}</span>
          <span className="text-xs text-muted-foreground">→ {formatDate(r.endDate)}</span>
        </div>
      ),
    },
    { key: "status", header: "Status", value: (r) => r.status, cell: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <UrlFilterSelect
          param="status"
          label="Filter by status"
          options={[
            { value: "upcoming", label: "Upcoming" },
            { value: "active", label: "Active" },
            { value: "completed", label: "Completed" },
            { value: "cancelled", label: "Cancelled" },
          ]}
          placeholder="All statuses"
        />
        <Button size="sm" className="ml-auto" onClick={() => setSheet({ mode: "create" })}>
          <PlusIcon /> New batch
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        searchPlaceholder="Search batches…"
        searchValue={(r) => `${r.name} ${r.code} ${r.courseName} ${r.tutors.map((t) => t.name).join(" ")}`}
        exportFileName="batches"
        emptyTitle="No batches yet"
        emptyDescription="Create a batch to schedule a course with tutors and capacity."
        actions={(r) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${r.name}`}>
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={() => setSheet({ mode: "edit", batch: r })}>
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
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{sheet?.mode === "edit" ? "Edit batch" : "New batch"}</SheetTitle>
            <SheetDescription>
              {sheet?.mode === "edit"
                ? "Update schedule, capacity and tutor assignments."
                : "Schedule a course run with days, times and tutors."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            {sheet ? (
              <BatchForm
                key={sheet.batch?.id ?? "new"}
                mode={sheet.mode}
                batch={sheet.batch}
                options={options}
                onDone={() => setSheet(null)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this batch?"
        description={`${deleteTarget?.name} will be removed with its timetable slots. Batches with enrolled students cannot be deleted.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (deleteTarget) void removeBatch(deleteTarget); }}
      />
    </>
  );
}
