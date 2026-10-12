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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { UrlFilterSelect } from "@/components/tables/url-filter-select";
import { MaterialForm } from "@/components/tutor/material-form";
import type { CourseTreeNode, MaterialView } from "@/components/tutor/types";
import { apiRequest } from "@/lib/client-api";
import { formatDate } from "@/lib/format";
import {
  ExternalLinkIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

const titleize = (v: string) => v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function MaterialsClient({
  materials,
  courses,
  typeFilter,
}: {
  materials: MaterialView[];
  courses: CourseTreeNode[];
  typeFilter: string | null;
}) {
  const router = useRouter();
  const [sheet, setSheet] = React.useState<null | { mode: "create" | "edit"; material?: MaterialView }>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<MaterialView | null>(null);

  async function removeMaterial(material: MaterialView) {
    try {
      const result = await apiRequest(`/api/tutor/materials/${material.id}`, { method: "DELETE" });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success("Material removed");
      router.refresh();
    } finally {
      setDeleteTarget(null);
    }
  }

  const visible = typeFilter ? materials.filter((m) => m.type === typeFilter) : materials;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <UrlFilterSelect
          param="type"
          label="Filter by type"
          options={[
            { value: "note", label: "Notes" },
            { value: "past_question", label: "Past questions" },
            { value: "video", label: "Videos" },
            { value: "link", label: "Links" },
            { value: "other", label: "Other" },
          ]}
          placeholder="All types"
        />
        <Button size="sm" className="ml-auto" onClick={() => setSheet({ mode: "create" })}>
          <PlusIcon /> Share material
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={typeFilter ? "No materials of this type" : "No materials yet"}
          description={
            typeFilter
              ? "Try a different type filter."
              : "Share notes, past questions, videos and links with your students."
          }
          action={
            typeFilter
              ? { label: "Show all", href: "/tutor/materials" }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((m) => (
            <Card key={m.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="font-medium">
                    {titleize(m.type)}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${m.title}`}>
                        <MoreHorizontalIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onSelect={() => setSheet({ mode: "edit", material: m })}>
                        <PencilIcon /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(m)}>
                        <Trash2Icon /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-base">{m.title}</CardTitle>
                <CardDescription>
                  {m.courseName}
                  {m.batchName ? ` · ${m.batchName}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                {m.description ? <p className="text-sm text-muted-foreground">{m.description}</p> : null}
                {m.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {m.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs font-normal">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <span className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</span>
                  <Button asChild size="sm" variant="outline">
                    <a href={m.url} target="_blank" rel="noreferrer">
                      <ExternalLinkIcon /> Open
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={sheet !== null} onOpenChange={(o) => !o && setSheet(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{sheet?.mode === "edit" ? "Edit material" : "Share material"}</SheetTitle>
            <SheetDescription>
              {sheet?.mode === "edit"
                ? "Update this resource."
                : "Add a note, past question, video or link for your students."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            {sheet ? (
              <MaterialForm
                key={sheet.material?.id ?? "new"}
                mode={sheet.mode}
                material={sheet.material}
                courses={courses}
                onDone={() => setSheet(null)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Remove this material?"
        description={`“${deleteTarget?.title}” will be removed from your students' resource lists.`}
        confirmLabel="Remove"
        destructive
        onConfirm={() => { if (deleteTarget) void removeMaterial(deleteTarget); }}
      />
    </>
  );
}
