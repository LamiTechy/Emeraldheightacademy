import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assignments } from "@/db/schema";
import { jsonError, jsonOk } from "@/lib/api";
import { requireApiRole } from "@/lib/auth/api-guard";
import { listSubmissions } from "@/lib/queries/tutor";
import { formatDateTime } from "@/lib/format";

type Params = { params: Promise<{ id: string }> };

/** Submissions for one of the tutor's assignments (for the grading dialog). */
export async function GET(_request: Request, { params }: Params) {
  const guard = await requireApiRole("tutor");
  if (guard.response) return guard.response;
  const tutor = guard.user;
  if (!tutor.tutorRowId) return jsonError("Tutor profile missing", 403);

  const { id } = await params;

  const assignment = await db.query.assignments.findFirst({
    where: eq(assignments.id, id),
    columns: { id: true, tutorId: true, points: true },
  });
  if (!assignment || assignment.tutorId !== tutor.tutorRowId) {
    return jsonError("Assignment not found", 404);
  }

  const rows = await listSubmissions(id);
  const submissions = rows.map((r) => ({
    id: r.s.id,
    studentId: r.studentId,
    studentName: r.name,
    studentCode: r.studentCode,
    email: r.email,
    content: r.s.content,
    fileUrl: r.s.fileUrl,
    fileName: r.s.fileName,
    status: r.s.status,
    score: r.s.score === null ? null : Number(r.s.score),
    feedback: r.s.feedback,
    submittedAt: formatDateTime(r.s.submittedAt),
    gradedAt: r.s.gradedAt ? formatDateTime(r.s.gradedAt) : null,
  }));

  return jsonOk({ submissions, points: assignment.points });
}
