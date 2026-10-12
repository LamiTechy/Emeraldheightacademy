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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CategoryBadge, ModeBadge, StatusBadge } from "@/components/shared/badges";
import { DataTable, type Column } from "@/components/tables/data-table";
import { UrlFilterSelect } from "@/components/tables/url-filter-select";
import { CourseForm } from "@/components/admin/course-form";
import type { CourseView } from "@/components/admin/types";
import { apiRequest } from "@/lib/client-api";
import { plural } from "@/lib/format";
import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";

export function CoursesClient({ rows }: { rows: CourseView[] }) {
  const router = useRouter();
  const [sheet, setSheet] = React.useState<null | { mode: "create" | "edit"; course?: CourseView }>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = React.useState<CourseView | null>(null);

  async function removeCourse(course: CourseView) {
    try {
      const result = await apiRequest(`/api/admin/courses/${course.id}`, { method: "DELETE" });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success("Course deleted");
      router.refresh();
    } finally {
      setDeleteTarget(null);
    }
  }

  const columns: Column<CourseView>[] = [
    {
      key: "name",
      header: "Course",
      value: (r) => `${r.name} ${r.code}`,
      cell: (r) => (
        <div className="flex min-w-0 flex-col">
          <span className="flex items-center gap-1.5 font-medium">
            {r.featured ? <StarIcon className="size-3 text-amber-500" /> : null}
            {r.name}
          </span>
          <span className="font-mono text-xs text-muted-foreground">{r.code}</span>
        </div>
      ),
    },
    { key: "category", header: "Category", value: (r) => r.category, cell: (r) => <CategoryBadge category={r.category as never} /> },
    { key: "mode", header: "Mode", value: (r) => r.mode, cell: (r) => <ModeBadge mode={r.mode as never} /> },
    { key: "status", header: "Status", value: (r) => r.status, cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: "duration",
      header: "Duration",
      value: (r) => r.durationWeeks ?? 0,
      cell: (r) => (r.durationWeeks ? `${r.durationWeeks} ${plural(r.durationWeeks, "week")}` : "—"),
    },
    {
      key: "batches",
      header: "Batches",
      value: (r) => r.batchCount,
      cell: (r) => r.batchCount,
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
            { value: "inactive", label: "Inactive" },
            { value: "archived", label: "Archived" },
          ]}
          placeholder="All statuses"
        />
        <Button size="sm" className="ml-auto" onClick={() => setSheet({ mode: "create" })}>
          <PlusIcon /> New course
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        searchPlaceholder="Search courses…"
        searchValue={(r) => `${r.name} ${r.code} ${r.category}`}
        exportFileName="courses"
        emptyTitle="No courses yet"
        emptyDescription="Create your first course — JAMB, WAEC, primary or coding."
        actions={(r) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${r.name}`}>
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={() => setSheet({ mode: "edit", course: r })}>
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
            <SheetTitle>{sheet?.mode === "edit" ? "Edit course" : "New course"}</SheetTitle>
            <SheetDescription>
              {sheet?.mode === "edit"
                ? "Update course details shown across the site and portals."
                : "Add a course offered by the centre."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            {sheet ? (
              <CourseForm
                key={sheet.course?.id ?? "new"}
                mode={sheet.mode}
                course={sheet.course}
                onDone={() => setSheet(null)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this course?"
        description={
          deleteTarget
            ? `${deleteTarget.name} and its batches will be permanently removed. Courses with enrollments cannot be deleted — archive them instead.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (deleteTarget) void removeCourse(deleteTarget); }}
      />
    </>
  );
}
