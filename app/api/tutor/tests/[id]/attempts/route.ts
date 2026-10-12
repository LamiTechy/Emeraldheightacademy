import { jsonError, jsonOk } from "@/lib/api";
import { requireApiRole } from "@/lib/auth/api-guard";
import { getOwnedTest, listTestAttempts } from "@/lib/queries/tutor-tests";
import { formatDateTime } from "@/lib/format";

type Params = { params: Promise<{ id: string }> };

/** Attempts on a tutor-owned test (for the grading dialog). */
export async function GET(_request: Request, { params }: Params) {
  const guard = await requireApiRole("tutor");
  if (guard.response) return guard.response;
  const tutor = guard.user;
  if (!tutor.tutorRowId) return jsonError("Tutor profile missing", 403);

  const { id } = await params;
  const test = await getOwnedTest(id, tutor.tutorRowId);
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
