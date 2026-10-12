import { jsonError, jsonOk } from "@/lib/api";
import { requireApiRole } from "@/lib/auth/api-guard";
import { getTestForStudent, loadQuizPayload } from "@/lib/queries/tutor-tests";

type Params = { params: Promise<{ id: string }> };

/** Student-safe quiz payload for an in-progress attempt (no answers leak). */
export async function GET(_request: Request, { params }: Params) {
  const guard = await requireApiRole("student");
  if (guard.response) return guard.response;
  const student = guard.user;
  if (!student.studentRowId) return jsonError("Student profile missing", 403);

  const { id } = await params;
  const test = await getTestForStudent(id, student.studentRowId);
  if (!test) return jsonError("Test not found or not available", 404);

  const payload = await loadQuizPayload(test.id, student.studentRowId);
  if ("error" in payload) return jsonError(payload.error, 409);
  return jsonOk({ ...payload });
}
