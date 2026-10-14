export const instant = false;

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import {
  getTutorStats,
  listSlotsForDay,
  listTutorBatches,
} from "@/lib/queries/tutor";
import { DAY_NAMES, formatDays, plural, shortTime } from "@/lib/format";
import {
  ArrowRightIcon,
  CalendarCheckIcon,
  CalendarIcon,
  ClipboardListIcon,
  ListChecksIcon,
  MapPinIcon,
  UsersIcon,
} from "lucide-react";

export default async function TutorDashboardPage() {
  const user = await requireUser("tutor");
  const firstName = user.name.split(" ")[0] ?? "there";

  const batchRows = user.tutorRowId ? await listTutorBatches(user.tutorRowId) : [];
  const batchIds = batchRows.map((r) => r.batch.id);
  const stats = user.tutorRowId
    ? await getTutorStats(user.tutorRowId, batchIds)
    : { studentsTaught: 0, awaitingGrading: 0, assignmentsCount: 0 };
  const today = new Date();
  const slots = user.tutorRowId ? await listSlotsForDay(user.tutorRowId, today.getDay()) : [];

  return (
    <>
      <PageHeader
        title={`Welcome, ${firstName}`}
        description="Your batches, attendance and grading queue at a glance."
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/tutor/attendance">
            <CalendarCheckIcon /> Mark attendance
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/tutor/assignments">
            <ListChecksIcon /> Assignments
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarIcon}
          label="My batches"
          value={batchRows.length}
          hint={batchRows.length > 0 ? "Active teaching groups" : "Ask the admin to assign you"}
        />
        <StatCard
          icon={UsersIcon}
          label="Students taught"
          value={stats.studentsTaught}
          hint="Unique students across batches"
        />
        <StatCard
          icon={ListChecksIcon}
          label="Assignments set"
          value={stats.assignmentsCount}
          hint="All time"
        />
        <StatCard
          icon={ClipboardListIcon}
          label="Awaiting grading"
          value={stats.awaitingGrading}
          hint={stats.awaitingGrading > 0 ? "Submissions to review" : "Grading queue is clear"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s classes</CardTitle>
            <CardDescription>
              {DAY_NAMES[today.getDay()]} sessions on your timetable
            </CardDescription>
          </CardHeader>
          <CardContent>
            {slots.length === 0 ? (
              <EmptyState
                title="Nothing scheduled today"
                description="Your timetable sessions for today will appear here."
                action={{ label: "Open timetable", href: "/tutor/timetable" }}
              />
            ) : (
              <ul className="divide-y">
                {slots.map((s) => (
                  <li key={s.slot.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex w-24 shrink-0 flex-col">
                      <span className="font-mono text-sm font-medium">
                        {shortTime(s.slot.startTime)}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {shortTime(s.slot.endTime)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {s.batch.code} — {s.batch.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{s.course.name}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {s.slot.room ? (
                        <Badge variant="secondary" className="gap-1 text-xs font-normal">
                          <MapPinIcon className="size-3" /> {s.slot.room}
                        </Badge>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Grading queue</CardTitle>
            <CardDescription>Assignment submissions waiting for review</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.awaitingGrading > 0 ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm">
                  <span className="font-semibold">{stats.awaitingGrading}</span>{" "}
                  {plural(stats.awaitingGrading, "submission")} awaiting grading.
                </p>
                <Button asChild size="sm">
                  <Link href="/tutor/assignments">
                    Review submissions <ArrowRightIcon />
                  </Link>
                </Button>
              </div>
            ) : (
              <EmptyState
                title="All caught up"
                description="New submissions to grade will show up here."
                action={{ label: "Go to assignments", href: "/tutor/assignments" }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {batchRows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>My batches</CardTitle>
            <CardDescription>Courses you are currently teaching</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {batchRows.map((r) => (
                <li key={r.batch.id} className="flex flex-wrap items-center gap-2 py-3 first:pt-0 last:pb-0">
                  <span className="font-mono text-xs text-muted-foreground">{r.batch.code}</span>
                  <span className="text-sm font-medium">{r.batch.name}</span>
                  <span className="text-xs text-muted-foreground">{r.course.name}</span>
                  <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs font-normal">
                      {formatDays(r.batch.daysOfWeek)}
                    </Badge>
                    <Badge variant="outline" className="text-xs font-normal capitalize">
                      {r.batch.mode}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/tutor/students">
            My Students <ArrowRightIcon />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/tutor/materials">
            Materials <ArrowRightIcon />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/tutor/announcements">
            Announcements <ArrowRightIcon />
          </Link>
        </Button>
      </div>
    </>
  );
}
