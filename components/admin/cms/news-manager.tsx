"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/badges";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/client-api";
import { formatDate } from "@/lib/format";
import { ExternalLinkIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

export type NewsRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  coverImageUrl: string | null;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
};

function NewsDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: NewsRow | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [title, setTitle] = React.useState(editing?.title ?? "");
  const [excerpt, setExcerpt] = React.useState(editing?.excerpt ?? "");
  const [body, setBody] = React.useState(editing?.body ?? "");
  const [cover, setCover] = React.useState(editing?.coverImageUrl ?? "");
  const [published, setPublished] = React.useState(editing?.published ?? false);

  async function save() {
    if (!title.trim() || body.trim().length < 10) {
      toast.error("Title and a fuller body are required");
      return;
    }
    setBusy(true);
    try {
      const result = editing
        ? await apiRequest(`/api/admin/cms/news/${editing.id}`, {
            method: "PATCH",
            body: {
              title: title.trim(),
              excerpt: excerpt.trim(),
              body: body.trim(),
              coverImageUrl: cover.trim() || undefined,
              published,
            },
          })
        : await apiRequest("/api/admin/cms/news", {
            method: "POST",
            body: {
              title: title.trim(),
              excerpt: excerpt.trim() || undefined,
              body: body.trim(),
              coverImageUrl: cover.trim() || undefined,
              published,
            },
          });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success(editing ? "Article updated" : "Article created");
      onOpenChange(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit article" : "New article"}</DialogTitle>
          <DialogDescription>Appears on the public /news page when published.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="n-title">Title</Label>
            <Input id="n-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="n-excerpt">Excerpt (optional)</Label>
            <Textarea id="n-excerpt" rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="n-body">Body</Label>
            <Textarea id="n-body" rows={10} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="n-cover">Cover image URL (optional)</Label>
            <Input id="n-cover" value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://…" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={published} onCheckedChange={setPublished} id="n-pub" />
            <Label htmlFor="n-pub">Published (visible on the public site)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={busy}>
            {busy ? "Saving…" : editing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NewsManager({ items }: { items: NewsRow[] }) {
  const router = useRouter();
  const [dialog, setDialog] = React.useState<null | { mode: "create" | "edit"; item?: NewsRow }>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<NewsRow | null>(null);

  async function remove(item: NewsRow) {
    try {
      const result = await apiRequest(`/api/admin/cms/news/${item.id}`, { method: "DELETE" });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success("Article deleted");
      router.refresh();
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <>
      <div className="flex justify-end pb-2">
        <Button size="sm" onClick={() => setDialog({ mode: "create" })}>
          <PlusIcon /> New article
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No articles yet" description="Write your first news article for the public site." />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <Card key={n.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{n.title}</CardTitle>
                    <CardDescription>
                      {formatDate(n.createdAt)}
                      {n.publishedAt ? ` · published ${formatDate(n.publishedAt)}` : ""}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusBadge status={n.published ? "published" : "draft"} />
                    <Button size="icon" variant="ghost" onClick={() => setDialog({ mode: "edit", item: n })}>
                      <PencilIcon />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(n)}>
                      <Trash2Icon className="text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {n.published ? (
                <CardContent className="pt-0">
                  <a
                    href={`/news/${n.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    View on site <ExternalLinkIcon className="size-3.5" />
                  </a>
                </CardContent>
              ) : null}
            </Card>
          ))}
        </div>
      )}
      {dialog ? (
        <NewsDialog
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
        title="Delete article?"
        description={`“${deleteTarget?.title}” will be permanently removed.`}
        onConfirm={() => {
          if (deleteTarget) void remove(deleteTarget);
        }}
      />
    </>
  );
}
