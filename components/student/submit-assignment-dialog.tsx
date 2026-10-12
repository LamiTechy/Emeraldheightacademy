"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/client-api";
import type { assignments, submissions } from "@/db/schema";

type AssignmentRow = typeof assignments.$inferSelect;
type SubmissionRow = typeof submissions.$inferSelect;

export function SubmitAssignmentDialog({
  assignment,
  submission,
  open,
  onOpenChange,
}: {
  assignment: AssignmentRow;
  submission: SubmissionRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [content, setContent] = React.useState(submission?.content ?? "");
  const [fileUrl, setFileUrl] = React.useState(submission?.fileUrl ?? "");
  const [fileName, setFileName] = React.useState(submission?.fileName ?? "");

  const graded = submission?.status === "graded";
  const closed = new Date(assignment.dueAt) < new Date();

  async function submit() {
    if (!content.trim() && !fileUrl.trim()) {
      toast.error("Add your answer text or an attachment link");
      return;
    }
    setBusy(true);
    try {
      const result = await apiRequest(`/api/student/assignments/${assignment.id}/submit`, {
        method: "POST",
        body: {
          content: content.trim() || null,
          fileUrl: fileUrl.trim() || null,
          fileName: fileName.trim() || null,
        },
      });
      if (!result.ok) {
        toast.error(result.error ?? "Submission failed");
        return;
      }
      toast.success(submission ? "Resubmitted" : "Submitted");
      onOpenChange(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    setBusy(true);
    try {
      const result = await apiRequest(`/api/student/assignments/${assignment.id}/submit`, {
        method: "DELETE",
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not withdraw");
        return;
      }
      toast.success("Submission withdrawn");
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
          <DialogTitle>{submission ? "Update submission" : "Submit work"}</DialogTitle>
          <DialogDescription>
            {assignment.title} — due {new Date(assignment.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </DialogDescription>
        </DialogHeader>
        {graded ? (
          <p className="text-sm text-muted-foreground">This submission has been graded.</p>
        ) : closed ? (
          <p className="text-sm text-destructive">The due date has passed — submissions are closed.</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sa-content">Answer / notes</Label>
              <Textarea
                id="sa-content"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your answer here…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sa-file">Attachment link (optional)</Label>
              <Input
                id="sa-file"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://drive.google.com/…"
              />
              <Input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="File name (e.g. homework-week-3.pdf)"
                className="mt-2"
              />
            </div>
          </div>
        )}
        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          <div className="flex gap-2">
            {submission && !graded && !closed ? (
              <Button variant="ghost" size="sm" onClick={withdraw} disabled={busy}>
                Withdraw
              </Button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
              Close
            </Button>
            {!graded && !closed ? (
              <Button size="sm" onClick={submit} disabled={busy}>
                {busy ? "Saving…" : submission ? "Resubmit" : "Submit"}
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
