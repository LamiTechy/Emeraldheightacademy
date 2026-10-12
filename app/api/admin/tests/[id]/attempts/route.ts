import { eq } from "drizzle-orm";
import { jsonError, jsonOk } from "@/lib/api";
import { requireApiRole } from "@/lib/auth/api-guard";
import { listTestAttempts } from "@/lib/queries/tutor-tests";
import { db } from "@/db";
import { tests } from "@/db/schema";
import { formatDateTime } from "@/lib/format";

type Params = { params: Promise<{ id: string }> };

/** Attempts on any test (admin oversight — read-only). */
export async function GET(_request: Request, { params }: Params) {
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;

  const { id } = await params;
  const test = await db.query.tests.findFirst({ where: eq(tests.id, id), columns: { id: true } });
  if (!test) return jsonError("Test not found", 404);

  const rows = await listTestAttempts(test.id);
  return jsonOk({
    attempts: rows.map((r) => ({
      id: r.a.id,
      studentName: r.name,
      studentCode: r.studentCode,
      email: r.email,
      attemptNumber: r.a.attemptNumber,
      status: r.a.status,
      startedAt: formatDateTime(r.a.startedAt),
      submittedAt: r.a.submittedAt ? formatDateTime(r.a.submittedAt) : null,
      autoSubmitted: r.a.autoSubmitted,
      totalScore: r.a.totalScore === null ? null : Number(r.a.totalScore),
      maxScore: r.a.maxScore === null ? null : Number(r.a.maxScore),
      tabSwitchCount: r.a.tabSwitchCount,
    })),
  });
}
