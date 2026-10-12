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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/badges";
import { DataTable, type Column } from "@/components/tables/data-table";
import { UrlFilterSelect } from "@/components/tables/url-filter-select";
import { EnrollForm } from "@/components/admin/enroll-form";
import type { EnrollmentView, FormOptions } from "@/components/admin/types";
import { apiRequest } from "@/lib/client-api";
import { formatDate } from "@/lib/format";
import { MoreHorizontalIcon, PlusIcon, Trash2Icon } from "lucide-react";

const STATUS_ACTIONS = [
  { value: "active", label: "Mark active" },
  { value: "waitlisted", label: "Move to waitlist" },
  { value: "completed", label: "Mark completed" },
  { value: "dropped", label: "Drop student" },
] as const;

export function EnrollmentsClient({
  rows,
  options,
  batchFilterOptions,
}: {
  rows: EnrollmentView[];
  options: FormOptions;
  batchFilterOptions: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [statusTarget, setStatusTarget] = React.useState<EnrollmentView | null>(null);
  const [nextStatus, setNextStatus] = React.useState<string>("active");
  const [deleteTarget, setDeleteTarget] = React.useState<EnrollmentView | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function changeStatus(enrollment: EnrollmentView, status: string) {
    setBusy(true);
    try {
      const result = await apiRequest(`/api/admin/enrollments/${enrollment.id}`, {
        method: "PATCH",
        body: { status },
      });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success(`Enrollment marked ${status}`);
      setStatusTarget(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeEnrollment(enrollment: EnrollmentView) {
    setBusy(true);
    try {
      const result = await apiRequest(`/api/admin/enrollments/${enrollment.id}`, {
        method: "DELETE",
      });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success("Enrollment removed");
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<EnrollmentView>[] = [
    {
      key: "student",
      header: "Student",
      value: (r) => `${r.studentName} ${r.studentEmail} ${r.studentCode}`,
      cell: (r) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{r.studentName}</span>
          <span className="truncate text-xs text-muted-foreground">
            <span className="font-mono">{r.studentCode}</span> · {r.studentEmail}
          </span>
        </div>
      ),
    },
    {
      key: "batch",
      header: "Batch",
      value: (r) => `${r.batchName} ${r.batchCode} ${r.courseName}`,
      cell: (r) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate">{r.batchName}</span>
          <span className="text-xs text-muted-foreground">
            {r.batchCode} · {r.courseName}
          </span>
        </div>
      ),
    },
    { key: "status", header: "Status", value: (r) => r.status, cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: "enrolledAt",
      header: "Enrolled",
      value: (r) => r.enrolledAt ?? "",
      cell: (r) => (r.enrolledAt ? formatDate(r.enrolledAt) : "—"),
    },
    {
      key: "notes",
      header: "Notes",
      value: (r) => r.notes ?? "",
      cell: (r) => (
        <span className="line-clamp-2 max-w-48 text-xs text-muted-foreground">{r.notes ?? "—"}</span>
      ),
      sortable: false,
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <UrlFilterSelect
          param="status"
          label="Filter by status"
          options={[
            { value: "active", label: "Active" },
            { value: "pending", label: "Pending" },
            { value: "waitlisted", label: "Waitlisted" },
            { value: "completed", label: "Completed" },
            { value: "dropped", label: "Dropped" },
          ]}
          placeholder="All statuses"
        />
        <UrlFilterSelect
          param="batch"
          label="Filter by batch"
          options={batchFilterOptions}
          placeholder="All batches"
          width="w-[200px]"
        />
        <Button size="sm" className="ml-auto" onClick={() => setSheetOpen(true)}>
          <PlusIcon /> Enroll student
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        searchPlaceholder="Search student…"
        searchValue={(r) => `${r.studentName} ${r.studentEmail} ${r.studentCode} ${r.batchCode}`}
        exportFileName="enrollments"
        emptyTitle="No enrollments"
        emptyDescription="Enroll students into batches to get started."
        actions={(r) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${r.studentName}`}>
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {STATUS_ACTIONS.filter((s) => s.value !== r.status).map((s) => (
                <DropdownMenuItem
                  key={s.value}
                  onSelect={() => {
                    setNextStatus(s.value);
                    setStatusTarget(r);
                  }}
                >
                  {s.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(r)}>
                <Trash2Icon /> Remove record
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Enroll student</SheetTitle>
            <SheetDescription>
              Place an active student into an upcoming or running batch.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <EnrollForm options={options} onDone={() => setSheetOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={statusTarget !== null} onOpenChange={(o) => !o && setStatusTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change status</DialogTitle>
            <DialogDescription>
              Update the enrollment status for {statusTarget?.studentName} in {statusTarget?.batchCode}.
            </DialogDescription>
          </DialogHeader>
          <Select value={nextStatus} onValueChange={setNextStatus}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ACTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStatusTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={busy}
              onClick={() => statusTarget && void changeStatus(statusTarget, nextStatus)}
            >
              {busy ? "Saving…" : "Apply"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Remove this enrollment?"
        description={`${deleteTarget?.studentName} will be removed from ${deleteTarget?.batchCode}. Prefer marking them as dropped to keep the history.`}
        confirmLabel="Remove"
        destructive
        onConfirm={() => { if (deleteTarget) void removeEnrollment(deleteTarget); }}
      />
    </>
  );
}
