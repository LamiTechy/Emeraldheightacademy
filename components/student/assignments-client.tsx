"use client";

import * as React from "react";
import { StatusBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { SubmitAssignmentDialog } from "@/components/student/submit-assignment-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { CalendarClockIcon, PaperclipIcon, PenLineIcon, UploadIcon } from "lucide-react";

export type AssignmentView = {
  id: string;
  title: string;
  instructions: string;
  dueAt: Date;
  points: number;
  attachmentUrl: string | null;
  attachmentName: string | null;
  batchCode: string;
  courseName: string;
  status: string;
  submission: {
    id: string;
    status: string;
    score: string | null;
    feedback: string | null;
    content: string | null;
    fileUrl: string | null;
    fileName: string | null;
    submittedAt: Date;
  } | null;
};

export function AssignmentsClient({ assignments }: { assignments: AssignmentView[] }) {
  const [openId, setOpenId] = React.useState<string | null>(null);

  if (assignments.length === 0) {
    return (
      <EmptyState
        title="No assignments yet"
        description="Published assignments from your tutors will appear here."
      />
    );
  }

  const open = assignments.find((a) => a.id === openId);

  return (
    <>
      <div className="grid gap-4">
        {assignments.map((a) => {
          const due = new Date(a.dueAt);
          const overdue = !a.submission && due < new Date();
          const sub = a.submission;

          return (
            <Card key={a.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{a.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {a.courseName} · {a.batchCode} · {a.points} pts
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {sub ? (
                      <StatusBadge status={sub.status} />
                    ) : overdue ? (
                      <Badge variant="destructive">Overdue</Badge>
                    ) : (
                      <Badge variant="outline">Not submitted</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{a.instructions}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarClockIcon className="size-3.5" /> Due {formatDateTime(due)}
                  </span>
                  {a.attachmentUrl ? (
                    <a
                      href={a.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <PaperclipIcon className="size-3.5" /> {a.attachmentName ?? "Attachment"}
                    </a>
                  ) : null}
                  {sub ? (
                    <span>Submitted {formatDateTime(sub.submittedAt)}</span>
                  ) : null}
                  {sub?.score !== null && sub?.score !== undefined ? (
                    <span className="font-medium text-foreground">
                      Score: {sub.score}/{a.points}
                    </span>
                  ) : null}
                </div>
                {sub?.feedback ? (
                  <p className="rounded-lg border bg-muted/40 p-3 text-sm">
                    <span className="font-medium">Tutor feedback: </span>
                    {sub.feedback}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {sub?.content || sub?.fileUrl ? (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-primary">View my submission</summary>
                      <div className="mt-2 space-y-1 text-muted-foreground">
                        {sub.content ? <p className="whitespace-pre-wrap">{sub.content}</p> : null}
                        {sub.fileUrl ? (
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <UploadIcon className="size-3.5" /> {sub.fileName ?? "Attachment"}
                          </a>
                        ) : null}
                      </div>
                    </details>
                  ) : null}
                  <Button size="sm" variant={sub ? "outline" : "default"} onClick={() => setOpenId(a.id)}>
                    {sub ? <PenLineIcon /> : <UploadIcon />}
                    {sub ? "Update submission" : "Submit work"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {open ? (
        <SubmitAssignmentDialog
          assignment={{
            id: open.id,
            title: open.title,
            dueAt: open.dueAt,
          } as never}
          submission={open.submission as never}
          open
          onOpenChange={(o) => {
            if (!o) setOpenId(null);
          }}
        />
      ) : null}
    </>
  );
}
