"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/client-api";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

export type GalleryRow = {
  id: string;
  title: string;
  caption: string | null;
  imageUrl: string;
  category: string;
  sortOrder: number;
};

function GalleryDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: GalleryRow | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [title, setTitle] = React.useState(editing?.title ?? "");
  const [caption, setCaption] = React.useState(editing?.caption ?? "");
  const [imageUrl, setImageUrl] = React.useState(editing?.imageUrl ?? "");
  const [category, setCategory] = React.useState(editing?.category ?? "general");
  const [sortOrder, setSortOrder] = React.useState(editing?.sortOrder ?? 0);

  async function save() {
    if (!title.trim() || !imageUrl.trim()) {
      toast.error("Title and image URL are required");
      return;
    }
    setBusy(true);
    try {
      const body = {
        title: title.trim(),
        caption: caption.trim() || undefined,
        imageUrl: imageUrl.trim(),
        category: category.trim() || "general",
        sortOrder,
      };
      const result = editing
        ? await apiRequest(`/api/admin/cms/gallery/${editing.id}`, { method: "PATCH", body })
        : await apiRequest("/api/admin/cms/gallery", { method: "POST", body });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success(editing ? "Item updated" : "Item added");
      onOpenChange(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit gallery item" : "Add gallery item"}</DialogTitle>
          <DialogDescription>Images shown on the public /gallery page.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="g-title">Title</Label>
            <Input id="g-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="g-caption">Caption (optional)</Label>
            <Input id="g-caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="g-url">Image URL</Label>
            <Input id="g-url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="g-cat">Category</Label>
              <Input id="g-cat" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-sort">Sort order</Label>
              <Input
                id="g-sort"
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={busy}>
            {busy ? "Saving…" : editing ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function GalleryManager({ items }: { items: GalleryRow[] }) {
  const router = useRouter();
  const [dialog, setDialog] = React.useState<null | { mode: "create" | "edit"; item?: GalleryRow }>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<GalleryRow | null>(null);

  async function remove(item: GalleryRow) {
    try {
      const result = await apiRequest(`/api/admin/cms/gallery/${item.id}`, { method: "DELETE" });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success("Item deleted");
      router.refresh();
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <>
      <div className="flex justify-end pb-2">
        <Button size="sm" onClick={() => setDialog({ mode: "create" })}>
          <PlusIcon /> Add image
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="Gallery is empty" description="Add photos from classes and events." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {items.map((g) => (
            <Card key={g.id} className="overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.imageUrl} alt={g.title} className="aspect-square w-full object-cover" />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-sm">{g.title}</CardTitle>
                    <CardDescription className="truncate">{g.category}</CardDescription>
                  </div>
                  <div className="flex shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => setDialog({ mode: "edit", item: g })}>
                      <PencilIcon />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(g)}>
                      <Trash2Icon className="text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
      {dialog ? (
        <GalleryDialog
          open
          onOpenChange={(o) => {
            if (!o) setDialog(null);
          }}
          editing={dialog.mode === "edit" ? (dialog.item ?? null) : null}
        />
      ) : null}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title="Delete image?"
        description={`“${deleteTarget?.title}” will be removed from the gallery.`}
        onConfirm={() => {
          if (deleteTarget) void remove(deleteTarget);
        }}
      />
    </>
  );
}
