export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import {
  TestsClient,
  type AdminTestStats,
  type AdminTestView,
} from "@/components/admin/tests-client";
import { requireUser } from "@/lib/auth/session";
import { adminTestStats, listAllTests } from "@/lib/queries/admin-tests";
import { testStatusEnum } from "@/db/schema";
import { formatDate, formatDateTime } from "@/lib/format";

export default async function AdminTestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser("admin");
  const sp = await searchParams;
  const raw = typeof sp.status === "string" ? sp.status : null;
  const statusFilter =
    raw && (testStatusEnum.enumValues as readonly string[]).includes(raw) ? raw : null;

  const [data, stats] = await Promise.all([listAllTests(statusFilter), adminTestStats()]);

  const views: AdminTestView[] = data.rows.map((r) => ({
    id: r.t.id,
    title: r.t.title,
    courseName: r.course.name,
    batchCode: r.batch?.code ?? null,
    batchName: r.batch?.name ?? null,
    tutorName: r.tutorName,
    status: r.t.status,
    questionCount: data.qCounts.get(r.t.id) ?? 0,
    attemptCount: data.aCounts.get(r.t.id) ?? 0,
    durationMinutes: r.t.durationMinutes,
    startsAt: r.t.startsAt ? formatDateTime(r.t.startsAt) : null,
    endsAt: r.t.endsAt ? formatDateTime(r.t.endsAt) : null,
    createdAt: formatDate(r.t.createdAt),
  }));

  const viewStats: AdminTestStats = stats;

  return (
    <>
      <PageHeader
        title="Tests & Quizzes"
        description="Oversee tests created by tutors — publish, monitor and review attempts."
      />
      <TestsClient tests={views} stats={viewStats} />
    </>
  );
}
