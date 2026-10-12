"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AnnouncementFeed } from "@/components/shared/announcement-feed";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/client-api";
import { PlusIcon } from "lucide-react";

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  scope: string;
  audienceRole: string | null;
  pinned: boolean;
  publishAt: Date;
  authorName: string | null;
  courseName: string | null;
  batchCode: string | null;
};

type Option = {
  batch: { id: string; code: string; name: string };
  course: { id: string; name: string; code: string };
};

export function TutorAnnouncementsClient({
  announcements,
  options,
}: {
  announcements: AnnouncementRow[];
  options: Option[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [scope, setScope] = React.useState<"global" | "role" | "course" | "batch">("global");
  const [courseId, setCourseId] = React.useState("");
  const [batchId, setBatchId] = React.useState("");
  const [pinned, setPinned] = React.useState(false);

  // Unique courses from the tutor's batches.
  const courses = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; code: string }>();
    for (const o of options) {
      if (!map.has(o.course.id)) map.set(o.course.id, o.course);
    }
    return [...map.values()];
  }, [options]);

  const batchesForCourse = React.useMemo(
    () => options.filter((o) => o.course.id === courseId),
    [options, courseId],
  );

  async function publish() {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required");
      return;
    }
    setBusy(true);
    try {
      const result = await apiRequest("/api/tutor/announcements", {
        method: "POST",
        body: {
          title: title.trim(),
          body: body.trim(),
          scope,
          audienceRole: scope === "role" ? "student" : null,
          courseId: scope === "course" ? courseId || null : null,
          batchId: scope === "batch" ? batchId || null : null,
          pinned,
        },
      });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success("Announcement published");
      setOpen(false);
      setTitle("");
      setBody("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <Button size="sm" className="ml-auto" onClick={() => setOpen(true)}>
          <PlusIcon /> New announcement
        </Button>
      </div>

      <AnnouncementFeed announcements={announcements} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New announcement</DialogTitle>
            <DialogDescription>Reach everyone or just your batch / course.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ta-title">Title</Label>
              <Input id="ta-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ta-body">Body</Label>
              <Textarea id="ta-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={scope} onValueChange={(v) => setScope(v as typeof scope)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Everyone</SelectItem>
                  <SelectItem value="role">Students only</SelectItem>
                  {courses.length > 0 ? (
                    <SelectItem value="course">A course I teach</SelectItem>
                  ) : null}
                  {options.length > 0 ? (
                    <SelectItem value="batch">A batch I teach</SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>
            {scope === "course" ? (
              <div className="space-y-2">
                <Label>Course</Label>
                <Select
                  value={courseId}
                  onValueChange={(v) => {
                    setCourseId(v);
                    setBatchId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
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
                    {options.map(({ batch, course }) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.code} — {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {scope === "course" && courseId ? (
              <div className="space-y-2">
                <Label>Batch (optional — leave for whole course)</Label>
                <Select value={batchId || "all"} onValueChange={(v) => setBatchId(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All batches in this course</SelectItem>
                    {batchesForCourse.map(({ batch }) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <Switch checked={pinned} onCheckedChange={setPinned} id="ta-pin" />
              <Label htmlFor="ta-pin">Pin to the top</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button size="sm" onClick={publish} disabled={busy}>
              {busy ? "Publishing…" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
