"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

export type FaqRow = {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  active: boolean;
};

function FaqDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: FaqRow | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [question, setQuestion] = React.useState(editing?.question ?? "");
  const [answer, setAnswer] = React.useState(editing?.answer ?? "");
  const [category, setCategory] = React.useState(editing?.category ?? "General");
  const [active, setActive] = React.useState(editing?.active ?? true);

  async function save() {
    if (!question.trim() || answer.trim().length < 3) {
      toast.error("Question and answer are required");
      return;
    }
    setBusy(true);
    try {
      const body = { question: question.trim(), answer: answer.trim(), category: category.trim() || "General", active };
      const result = editing
        ? await apiRequest(`/api/admin/cms/faqs/${editing.id}`, { method: "PATCH", body })
        : await apiRequest("/api/admin/cms/faqs", { method: "POST", body });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success(editing ? "FAQ updated" : "FAQ added");
      onOpenChange(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit FAQ" : "New FAQ"}</DialogTitle>
          <DialogDescription>Shown on the public About page.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="f-q">Question</Label>
            <Input id="f-q" value={question} onChange={(e) => setQuestion(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="f-a">Answer</Label>
            <Textarea id="f-a" rows={5} value={answer} onChange={(e) => setAnswer(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="f-cat">Category</Label>
              <Input id="f-cat" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <Switch checked={active} onCheckedChange={setActive} id="f-active" />
              <Label htmlFor="f-active">Active (visible publicly)</Label>
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

export function FaqsManager({ items }: { items: FaqRow[] }) {
  const router = useRouter();
  const [dialog, setDialog] = React.useState<null | { mode: "create" | "edit"; item?: FaqRow }>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<FaqRow | null>(null);

  async function remove(item: FaqRow) {
    try {
      const result = await apiRequest(`/api/admin/cms/faqs/${item.id}`, { method: "DELETE" });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success("FAQ deleted");
      router.refresh();
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <>
      <div className="flex justify-end pb-2">
        <Button size="sm" onClick={() => setDialog({ mode: "create" })}>
          <PlusIcon /> Add FAQ
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No FAQs yet" description="Answer the questions families ask most." />
      ) : (
        <div className="space-y-3">
          {items.map((f) => (
            <Card key={f.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base">{f.question}</CardTitle>
                    <CardDescription>{f.category}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    {f.active ? null : <span className="text-xs text-muted-foreground">Hidden</span>}
                    <Button size="icon" variant="ghost" onClick={() => setDialog({ mode: "edit", item: f })}>
                      <PencilIcon />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(f)}>
                      <Trash2Icon className="text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">{f.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {dialog ? (
        <FaqDialog
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
        title="Delete FAQ?"
        description={`“${deleteTarget?.question}” will be removed.`}
        onConfirm={() => {
          if (deleteTarget) void remove(deleteTarget);
        }}
      />
    </>
  );
}
