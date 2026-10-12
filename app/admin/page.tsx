export const instant = false;

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { adminDashboardCounts } from "@/lib/queries/admin";
import {
  ArrowRightIcon,
  ArchiveIcon,
  BookOpenIcon,
  GraduationCapIcon,
  ListChecksIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  const firstName = user?.name.split(" ")[0] ?? "there";
  const counts = await adminDashboardCounts();

  return (
    <>
      <PageHeader
        title={`Good day, ${firstName}`}
        description="Everything across the centre, in one dashboard."
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/users">
            <UsersIcon /> Manage users
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/admin/courses">
            <BookOpenIcon /> Courses
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={UsersIcon}
          label="Active users"
          value={counts.activeUsers}
          hint="Students, tutors & admins"
        />
        <StatCard
          icon={GraduationCapIcon}
          label="Active enrollments"
          value={counts.activeEnrollments}
          hint="Students in active batches"
        />
        <StatCard
          icon={ArchiveIcon}
          label="Running batches"
          value={counts.runningBatches}
          hint="Batches currently running"
        />
        <StatCard
          icon={ListChecksIcon}
          label="Live tests"
          value={counts.liveTests}
          hint="Published by tutors"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Registration requests</CardTitle>
            <CardDescription>New sign-ups awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="No pending requests"
              description="Website registrations and contact messages will queue here for review."
              action={{ label: "Open users", href: "/admin/users" }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>System status</CardTitle>
                <CardDescription>Security & delivery checks</CardDescription>
              </div>
              <Badge variant="outline" className="gap-1 text-primary">
                <ShieldCheckIcon className="size-3" /> Healthy
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">JWT auth</span>
              <span className="font-medium">Non-expiring access + 14d refresh</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Login rate limit</span>
              <span className="font-medium">5 / 15 min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email delivery</span>
              <span className="font-medium">Brevo SMTP (optional)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/enrollments">
            Enrollments <ArrowRightIcon />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/timetable">
            Timetable <ArrowRightIcon />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/content">
            Site Content <ArrowRightIcon />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/audit">
            Audit Log <ArrowRightIcon />
          </Link>
        </Button>
      </div>
    </>
  );
}
