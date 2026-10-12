"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/badges";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/client-api";
import { formatDateTime } from "@/lib/format";
import { MapPinIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

export type EventRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string | null;
  location: string | null;
  startsAt: Date;
  endsAt: Date | null;
  status: string;
};

function toLocalInput(d: Date | null): string {
  if (!d) return "";
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

function EventDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: EventRow | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [title, setTitle] = React.useState(editing?.title ?? "");
  const [description, setDescription] = React.useState(editing?.description ?? "");
  const [location, setLocation] = React.useState(editing?.location ?? "");
  const [cover, setCover] = React.useState(editing?.coverImageUrl ?? "");
  const [startsAt, setStartsAt] = React.useState(toLocalInput(editing?.startsAt ?? null));
  const [status, setStatus] = React.useState(editing?.status ?? "upcoming");

  async function save() {
    if (!title.trim() || description.trim().length < 5 || !startsAt) {
      toast.error("Title, description and start time are required");
      return;
    }
    setBusy(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || undefined,
        coverImageUrl: cover.trim() || undefined,
        startsAt: new Date(startsAt).toISOString(),
        status,
      };
      const result = editing
        ? await apiRequest(`/api/admin/cms/events/${editing.id}`, { method: "PATCH", body })
        : await apiRequest("/api/admin/cms/events", { method: "POST", body });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success(editing ? "Event updated" : "Event created");
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
          <DialogTitle>{editing ? "Edit event" : "New event"}</DialogTitle>
          <DialogDescription>Shown on the public /events page.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="e-title">Title</Label>
            <Input id="e-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-desc">Description</Label>
            <Textarea id="e-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="e-start">Starts</Label>
              <Input id="e-start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-loc">Location (optional)</Label>
            <Input id="e-loc" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-cover">Cover image URL (optional)</Label>
            <Input id="e-cover" value={cover} onChange={(e) => setCover(e.target.value)} />
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

export function EventsManager({ items }: { items: EventRow[] }) {
  const router = useRouter();
  const [dialog, setDialog] = React.useState<null | { mode: "create" | "edit"; item?: EventRow }>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<EventRow | null>(null);

  async function remove(item: EventRow) {
    try {
      const result = await apiRequest(`/api/admin/cms/events/${item.id}`, { method: "DELETE" });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success("Event deleted");
      router.refresh();
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <>
      <div className="flex justify-end pb-2">
        <Button size="sm" onClick={() => setDialog({ mode: "create" })}>
          <PlusIcon /> New event
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No events yet" description="Add open days, mock exams or workshops." />
      ) : (
        <div className="space-y-3">
          {items.map((e) => (
            <Card key={e.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{e.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      {formatDateTime(e.startsAt)}
                      {e.location ? (
                        <>
                          <MapPinIcon className="size-3" /> {e.location}
                        </>
                      ) : null}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusBadge status={e.status} />
                    <Button size="icon" variant="ghost" onClick={() => setDialog({ mode: "edit", item: e })}>
                      <PencilIcon />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(e)}>
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
        <EventDialog
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
        title="Delete event?"
        description={`“${deleteTarget?.title}” will be permanently removed.`}
        onConfirm={() => {
          if (deleteTarget) void remove(deleteTarget);
        }}
      />
    </>
  );
}
