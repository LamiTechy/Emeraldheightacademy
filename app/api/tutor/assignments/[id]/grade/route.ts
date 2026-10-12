import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assignments, submissions } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { gradeSubmissionSchema } from "@/lib/validators/tutor";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

const gradeBodySchema = gradeSubmissionSchema.extend({
  submissionId: z.uuid("Select a submission"),
});

type Params = { params: Promise<{ id: string }> };

/** Grade or return a submission for one of the tutor's assignments. */
export async function POST(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("tutor");
  if (guard.response) return guard.response;
  const tutor = guard.user;
  if (!tutor.tutorRowId) return jsonError("Tutor profile missing", 403);

  const parsed = await parseJsonBody(request, gradeBodySchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const data = parsed.data;

  const { id } = await params;

  const assignment = await db.query.assignments.findFirst({
    where: eq(assignments.id, id),
    columns: { id: true, tutorId: true, title: true, points: true },
  });
  if (!assignment || assignment.tutorId !== tutor.tutorRowId) {
    return jsonError("Assignment not found", 404);
  }

  if (data.score > assignment.points) {
    return jsonError(`Score cannot exceed ${assignment.points} points`, 422, {
      fieldErrors: { score: [`Maximum is ${assignment.points}`] },
    });
  }

  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, data.submissionId),
    columns: { id: true, assignmentId: true, status: true },
  });
  if (!submission || submission.assignmentId !== assignment.id) {
    return jsonError("Submission not found", 404);
  }

  const now = new Date();
  await db
    .update(submissions)
    .set({
      score: String(data.score),
      feedback: data.feedback ?? null,
      status: data.action === "return" ? "returned" : "graded",
      gradedBy: tutor.id,
      gradedAt: now,
      updatedAt: now,
    })
    .where(eq(submissions.id, submission.id));

  await logAudit({
    actorId: tutor.id,
    actorRole: "tutor",
    action: data.action === "return" ? "tutor.submission_returned" : "tutor.submission_graded",
    entityType: "submission",
    entityId: submission.id,
    summary: `${data.action === "return" ? "Returned" : "Graded"} submission (${data.score}/${assignment.points}) for “${assignment.title}”`,
  });

  return jsonOk({ id: submission.id, status: data.action === "return" ? "returned" : "graded" });
}
