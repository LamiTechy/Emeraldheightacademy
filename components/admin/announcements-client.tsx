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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/client-api";
import { formatDate } from "@/lib/format";
import { MegaphoneIcon, PencilIcon, PinIcon, PlusIcon, Trash2Icon } from "lucide-react";

export type AdminAnnouncement = {
  id: string;
  title: string;
  body: string;
  scope: string;
  audienceRole: string | null;
  courseId: string | null;
  batchId: string | null;
  pinned: boolean;
  publishAt: Date;
  authorName: string | null;
  courseName: string | null;
  batchCode: string | null;
};

export type ScopeOptions = {
  courses: { id: string; name: string; code: string }[];
  batches: { batch: { id: string; code: string; name: string }; course: { id: string; name: string } }[];
};

function AnnouncementDialog({
  open,
  onOpenChange,
  options,
  editing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  options: ScopeOptions;
  editing?: AdminAnnouncement | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [title, setTitle] = React.useState(editing?.title ?? "");
  const [body, setBody] = React.useState(editing?.body ?? "");
  const [scope, setScope] = React.useState(editing?.scope ?? "global");
  const [audienceRole, setAudienceRole] = React.useState(editing?.audienceRole ?? "student");
  const [courseId, setCourseId] = React.useState(editing?.courseId ?? "");
  const [batchId, setBatchId] = React.useState(editing?.batchId ?? "");
  const [pinned, setPinned] = React.useState(editing?.pinned ?? false);

  async function save() {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        scope,
        audienceRole: scope === "role" ? audienceRole : null,
        courseId: scope === "course" ? courseId || null : null,
        batchId: scope === "batch" ? batchId || null : null,
        pinned,
      };
      const result = editing
        ? await apiRequest(`/api/admin/announcements/${editing.id}`, { method: "PATCH", body: { title: payload.title, body: payload.body, pinned } })
        : await apiRequest("/api/admin/announcements", { method: "POST", body: payload });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success(editing ? "Announcement updated" : "Announcement published");
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
          <DialogTitle>{editing ? "Edit announcement" : "New announcement"}</DialogTitle>
          <DialogDescription>Reach students, tutors or a specific batch.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ann-title">Title</Label>
            <Input id="ann-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ann-body">Body</Label>
            <Textarea id="ann-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          {!editing ? (
            <>
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select value={scope} onValueChange={setScope}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Everyone (site-wide)</SelectItem>
                    <SelectItem value="role">A role</SelectItem>
                    <SelectItem value="course">A course</SelectItem>
                    <SelectItem value="batch">A batch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {scope === "role" ? (
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={audienceRole} onValueChange={setAudienceRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="tutor">Tutors</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              {scope === "course" ? (
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Select value={courseId} onValueChange={setCourseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pick a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              {scope === "batch" ? (
                <div className="space-y-2">
                  <Label>Batch</Label>
                  <Select value={batchId} onValueChange={setBatchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pick a batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.batches.map(({ batch, course }) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.code} — {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </>
          ) : null}
          <div className="flex items-center gap-2">
            <Switch checked={pinned} onCheckedChange={setPinned} id="ann-pin" />
            <Label htmlFor="ann-pin">Pin to the top</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={busy}>
            {busy ? "Saving…" : editing ? "Save" : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AnnouncementsClient({
  announcements,
  options,
}: {
  announcements: AdminAnnouncement[];
  options: ScopeOptions;
}) {
  const router = useRouter();
  const [sheet, setSheet] = React.useState<null | { mode: "create" | "edit"; item?: AdminAnnouncement }>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminAnnouncement | null>(null);

  async function remove(item: AdminAnnouncement) {
    try {
      const result = await apiRequest(`/api/admin/announcements/${item.id}`, { method: "DELETE" });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success("Announcement deleted");
      router.refresh();
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <Button size="sm" className="ml-auto" onClick={() => setSheet({ mode: "create" })}>
          <PlusIcon /> New announcement
        </Button>
      </div>

      {announcements.length === 0 ? (
        <EmptyState
          title="No announcements yet"
          description="Publish updates to students, tutors or a specific batch."
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {a.pinned ? (
                      <span className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        <PinIcon className="size-4" />
                      </span>
                    ) : (
                      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <MegaphoneIcon className="size-4" />
                      </span>
                    )}
                    <CardTitle className="text-base">{a.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {a.scope === "global"
                        ? "All"
                        : a.scope === "role"
                          ? a.audienceRole ?? "Role"
                          : a.scope === "course"
                            ? a.courseName ?? "Course"
                            : a.batchCode ?? "Batch"}
                    </Badge>
                    {a.pinned ? <StatusBadge status="pending" /> : null}
                    <Button size="icon" variant="ghost" onClick={() => setSheet({ mode: "edit", item: a })}>
                      <PencilIcon />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(a)}>
                      <Trash2Icon className="text-destructive" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {a.authorName ?? "System"} · {formatDate(a.publishAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {sheet ? (
        <AnnouncementDialog
          open
          onOpenChange={(o) => {
            if (!o) setSheet(null);
          }}
          options={options}
          editing={sheet.mode === "edit" ? (sheet.item ?? null) : null}
        />
      ) : null}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title="Delete announcement?"
        description={`“${deleteTarget?.title}” will be permanently removed.`}
        onConfirm={() => {
          if (deleteTarget) void remove(deleteTarget);
        }}
      />
    </>
  );
}
