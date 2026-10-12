import { StatusBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { MegaphoneIcon, PinIcon } from "lucide-react";

export type AnnouncementView = {
  id: string;
  title: string;
  body: string;
  scope: string;
  pinned: boolean;
  publishAt: Date;
  authorName: string | null;
  courseName: string | null;
  batchCode: string | null;
};

const scopeLabel = (a: AnnouncementView) => {
  if (a.scope === "global") return "All";
  if (a.scope === "role") return "Role";
  if (a.scope === "course") return a.courseName ?? "Course";
  if (a.scope === "batch") return a.batchCode ?? "Batch";
  return a.scope;
};

/** Read-only announcement feed shared by student & tutor portals. */
export function AnnouncementFeed({ announcements }: { announcements: AnnouncementView[] }) {
  if (announcements.length === 0) {
    return (
      <EmptyState
        title="No announcements"
        description="Updates from your tutors and the centre office will appear here."
      />
    );
  }
  return (
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
                <Badge variant="secondary">{scopeLabel(a)}</Badge>
                {a.pinned ? <StatusBadge status="pending" /> : null}
              </div>
            </div>
            <CardDescription>
              {a.authorName ?? "Centre"} · {formatDate(a.publishAt)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
