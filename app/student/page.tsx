export const instant = false;

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/badges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import {
  getStudentDashboardStats,
  listStudentAnnouncements,
  listStudentSlots,
} from "@/lib/queries/student";
import { DAY_NAMES, shortTime } from "@/lib/format";
import {
  ArrowRightIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  CalendarIcon,
  ClipboardListIcon,
  ListChecksIcon,
  MegaphoneIcon,
} from "lucide-react";

export default async function StudentDashboardPage() {
  const user = await requireUser("student");
  const studentRowId = user.studentRowId;
  const firstName = user.name.split(" ")[0] ?? "there";

  const [stats, announcements, todaySlots] = studentRowId
    ? await Promise.all([
        getStudentDashboardStats(studentRowId),
        listStudentAnnouncements(studentRowId, 5),
        listStudentSlots(studentRowId, new Date().getDay()),
      ])
    : [{ coursesCount: 0, dueSoon: 0, attendanceRate: null, upcomingTests: [] }, [], []];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}!`}
        description="Your classes, tests and assignments — all in one place."
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/student/timetable">
            <CalendarIcon /> Timetable
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/student/tests">
            <ListChecksIcon /> Take a test
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={BookOpenIcon}
          label="Enrolled courses"
          value={stats.coursesCount}
          hint={stats.coursesCount === 0 ? "Contact the front desk" : "Active enrollments"}
        />
        <StatCard
          icon={ListChecksIcon}
          label="Upcoming tests"
          value={stats.upcomingTests.length}
          hint="Published for your courses"
        />
        <StatCard
          icon={ClipboardListIcon}
          label="Assignments due"
          value={stats.dueSoon}
          hint={stats.dueSoon === 0 ? "All caught up" : "After today"}
        />
        <StatCard
          icon={CalendarCheckIcon}
          label="Attendance rate"
          value={stats.attendanceRate === null ? "—" : `${stats.attendanceRate}%`}
          hint="Across all batches"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>News from the centre and your tutors</CardDescription>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <EmptyState
                title="No announcements yet"
                description="Important updates from your tutors will show up here."
                action={{ label: "View all", href: "/student/announcements" }}
              />
            ) : (
              <ul className="divide-y">
                {announcements.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MegaphoneIcon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        {a.pinned ? <StatusBadge status="pending" /> : null}
                        {a.title}
                      </p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{a.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s classes</CardTitle>
            <CardDescription>{DAY_NAMES[new Date().getDay()]} schedule</CardDescription>
          </CardHeader>
          <CardContent>
            {todaySlots.length === 0 ? (
              <EmptyState
                title="No sessions today"
                description="Your next classes show up here and on the timetable."
                action={{ label: "See timetable", href: "/student/timetable" }}
              />
            ) : (
              <ul className="divide-y">
                {todaySlots.map(({ slot, course, batch }) => (
                  <li key={slot.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{course.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {batch.code} · {slot.room ?? "Room TBA"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">
                      {shortTime(slot.startTime)}–{shortTime(slot.endTime)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {stats.upcomingTests.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming tests</CardTitle>
            <CardDescription>Published tests for your courses</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {stats.upcomingTests.map(({ t, course }) => {
                const start = t.startsAt ? new Date(t.startsAt) : null;
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {course.name}
                        {start ? ` · opens ${start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/student/tests/${t.id}`}>
                        Open <ArrowRightIcon />
                      </Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/student/courses">
            My Courses <ArrowRightIcon />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/student/assignments">
            Assignments <ArrowRightIcon />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/student/materials">
            Materials <ArrowRightIcon />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/student/results">
            Results <ArrowRightIcon />
          </Link>
        </Button>
      </div>
    </>
  );
}
