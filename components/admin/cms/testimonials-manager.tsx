"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/badges";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { PencilIcon, PlusIcon, StarIcon, Trash2Icon } from "lucide-react";

export type TestimonialRow = {
  id: string;
  name: string;
  program: string | null;
  quote: string;
  rating: number | null;
  featured: boolean;
  approved: boolean;
  sortOrder: number;
};

function TestimonialDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: TestimonialRow | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [name, setName] = React.useState(editing?.name ?? "");
  const [program, setProgram] = React.useState(editing?.program ?? "");
  const [quote, setQuote] = React.useState(editing?.quote ?? "");
  const [rating, setRating] = React.useState(editing?.rating ?? 5);
  const [featured, setFeatured] = React.useState(editing?.featured ?? false);
  const [approved, setApproved] = React.useState(editing?.approved ?? true);

  async function save() {
    if (!name.trim() || quote.trim().length < 5) {
      toast.error("Name and quote are required");
      return;
    }
    setBusy(true);
    try {
      const body = {
        name: name.trim(),
        program: program.trim() || undefined,
        quote: quote.trim(),
        rating,
        featured,
        approved,
      };
      const result = editing
        ? await apiRequest(`/api/admin/cms/testimonials/${editing.id}`, { method: "PATCH", body })
        : await apiRequest("/api/admin/cms/testimonials", { method: "POST", body });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success(editing ? "Testimonial updated" : "Testimonial added");
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
          <DialogTitle>{editing ? "Edit testimonial" : "New testimonial"}</DialogTitle>
          <DialogDescription>Approved testimonials appear on the public site.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="t-name">Name</Label>
              <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-program">Program (optional)</Label>
              <Input id="t-program" value={program} onChange={(e) => setProgram(e.target.value)} placeholder="e.g. JAMB 2025" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-quote">Quote</Label>
            <Textarea id="t-quote" rows={4} value={quote} onChange={(e) => setQuote(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="t-rating">Rating (1–5)</Label>
              <Input
                id="t-rating"
                type="number"
                min={1}
                max={5}
                value={rating ?? 5}
                onChange={(e) => setRating(Number(e.target.value) || 5)}
              />
            </div>
            <div className="flex items-end gap-4 pb-2">
              <div className="flex items-center gap-2">
                <Switch checked={featured} onCheckedChange={setFeatured} id="t-feat" />
                <Label htmlFor="t-feat">Featured</Label>
              </div>
            </div>
            <div className="flex items-end gap-4 pb-2">
              <div className="flex items-center gap-2">
                <Switch checked={approved} onCheckedChange={setApproved} id="t-appr" />
                <Label htmlFor="t-appr">Approved</Label>
              </div>
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

export function TestimonialsManager({ items }: { items: TestimonialRow[] }) {
  const router = useRouter();
  const [dialog, setDialog] = React.useState<null | { mode: "create" | "edit"; item?: TestimonialRow }>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<TestimonialRow | null>(null);

  async function remove(item: TestimonialRow) {
    try {
      const result = await apiRequest(`/api/admin/cms/testimonials/${item.id}`, { method: "DELETE" });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success("Testimonial deleted");
      router.refresh();
    } finally {
      setDeleteTarget(null);
    }
  }

  async function toggleApproved(item: TestimonialRow) {
    const result = await apiRequest(`/api/admin/cms/testimonials/${item.id}`, {
      method: "PATCH",
      body: { approved: !item.approved },
    });
    if (!result.ok) {
      toast.error(result.error ?? "Failed");
      return;
    }
    toast.success(item.approved ? "Unapproved" : "Approved");
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end pb-2">
        <Button size="sm" onClick={() => setDialog({ mode: "create" })}>
          <PlusIcon /> Add testimonial
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No testimonials yet" description="Add parent and student quotes." />
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <Card key={t.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    <CardDescription>{t.program ?? "—"}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    {t.featured ? <Badge variant="secondary">Featured</Badge> : null}
                    <StatusBadge status={t.approved ? "active" : "pending"} />
                    {t.rating ? (
                      <span className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <StarIcon key={i} className="size-3 fill-current" />
                        ))}
                      </span>
                    ) : null}
                    <Button size="icon" variant="ghost" onClick={() => void toggleApproved(t)}>
                      {t.approved ? "Unapprove" : "Approve"}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDialog({ mode: "edit", item: t })}>
                      <PencilIcon />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(t)}>
                      <Trash2Icon className="text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-muted-foreground">“{t.quote}”</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {dialog ? (
        <TestimonialDialog
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
        title="Delete testimonial?"
        description={`Testimonial from “${deleteTarget?.name}” will be removed.`}
        onConfirm={() => {
          if (deleteTarget) void remove(deleteTarget);
        }}
      />
    </>
  );
}
