export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { ModeBadge, StatusBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/session";
import { listStudentEnrollments } from "@/lib/queries/student";
import { formatDate } from "@/lib/format";
import { BookOpenIcon } from "lucide-react";

export default async function StudentCoursesPage() {
  const user = await requireUser("student");
  const rows = user.studentRowId ? await listStudentEnrollments(user.studentRowId) : [];

  return (
    <>
      <PageHeader title="My Courses" description="Courses you're enrolled in right now." />

      {rows.length === 0 ? (
        <EmptyState
          title="No active enrollments"
          description="Visit the front desk or wait for your registration to be approved."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map(({ enrollmentId, course, batch, enrolledAt }) => (
            <Card key={enrollmentId} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="secondary">{course.code}</Badge>
                  <ModeBadge mode={course.mode} />
                </div>
                <CardTitle className="text-base">{course.name}</CardTitle>
                <CardDescription>{course.description ?? "—"}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Batch</span>
                  <span className="font-medium">{batch.code}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={batch.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Enrolled</span>
                  <span>{formatDate(enrolledAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {rows.length > 0 ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <BookOpenIcon className="size-3.5" />
          Course materials, tests and assignments live under their own tabs in the sidebar.
        </p>
      ) : null}
    </>
  );
}
