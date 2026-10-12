import { and, eq } from "drizzle-orm";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { submitAssignmentSchema } from "@/lib/validators/student";
import { requireApiRole } from "@/lib/auth/api-guard";
import { db } from "@/db";
import { assignments, enrollments, submissions } from "@/db/schema";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

/** Submit (or resubmit while the assignment is still open) work for an assignment. */
export async function POST(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("student");
  if (guard.response) return guard.response;
  const student = guard.user;
  if (!student.studentRowId) return jsonError("Student profile missing", 403);

  const parsed = await parseJsonBody(request, submitAssignmentSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const d = parsed.data;

  if (!d.content?.trim() && !d.fileUrl?.trim()) {
    return jsonError("Add your answer text or an attachment link", 422, {
      fieldErrors: { content: ["Required unless you attach a link"] },
    });
  }

  const { id } = await params;
  const assignment = await db.query.assignments.findFirst({
    where: eq(assignments.id, id),
    with: { batch: true },
  });
  if (!assignment || assignment.status !== "published") {
    return jsonError("Assignment not found or not open", 404);
  }

  // Student must be actively enrolled in the assignment's batch.
  const enrolled = await db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.studentId, student.studentRowId),
      eq(enrollments.batchId, assignment.batchId),
      eq(enrollments.status, "active"),
    ),
    columns: { id: true },
  });
  if (!enrolled) return jsonError("You are not enrolled in that batch", 403);

  if (assignment.dueAt < new Date()) {
    return jsonError("The due date has passed — late submissions are closed", 422);
  }

  const now = new Date();
  const existing = await db.query.submissions.findFirst({
    where: and(
      eq(submissions.assignmentId, assignment.id),
      eq(submissions.studentId, student.studentRowId),
    ),
    columns: { id: true, status: true },
  });

  if (existing) {
    if (existing.status === "graded") {
      return jsonError("This submission has already been graded", 409);
    }
    await db
      .update(submissions)
      .set({
        content: d.content?.trim() || null,
        fileUrl: d.fileUrl?.trim() || null,
        fileName: d.fileName?.trim() || null,
        status: assignment.dueAt < now ? "late" : "submitted",
        submittedAt: now,
        updatedAt: now,
      })
      .where(eq(submissions.id, existing.id));
    await logAudit({
      actorId: student.id,
      actorRole: "student",
      action: "student.assignment_resubmitted",
      entityType: "submission",
      entityId: existing.id,
      summary: `Resubmitted “${assignment.title}”`,
    });
    return jsonOk({ id: existing.id, resubmitted: true });
  }

  const [row] = await db
    .insert(submissions)
    .values({
      assignmentId: assignment.id,
      studentId: student.studentRowId,
      content: d.content?.trim() || null,
      fileUrl: d.fileUrl?.trim() || null,
      fileName: d.fileName?.trim() || null,
      status: now > assignment.dueAt ? "late" : "submitted",
      submittedAt: now,
    })
    .returning({ id: submissions.id });

  await logAudit({
    actorId: student.id,
    actorRole: "student",
    action: "student.assignment_submitted",
    entityType: "submission",
    entityId: row!.id,
    summary: `Submitted “${assignment.title}”`,
  });

  return jsonOk({ id: row!.id, resubmitted: false });
}

/** Withdraw a submission (only while ungraded and before due). */
export async function DELETE(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("student");
  if (guard.response) return guard.response;
  const student = guard.user;
  if (!student.studentRowId) return jsonError("Student profile missing", 403);

  const { id } = await params;
  const assignment = await db.query.assignments.findFirst({
    where: eq(assignments.id, id),
    columns: { id: true, dueAt: true, status: true, title: true },
  });
  if (!assignment) return jsonError("Assignment not found", 404);

  const sub = await db.query.submissions.findFirst({
    where: and(
      eq(submissions.assignmentId, assignment.id),
      eq(submissions.studentId, student.studentRowId),
    ),
    columns: { id: true, status: true },
  });
  if (!sub) return jsonError("No submission to withdraw", 404);
  if (sub.status === "graded") return jsonError("Already graded — contact your tutor", 409);
  if (assignment.dueAt < new Date()) return jsonError("Due date has passed", 409);

  await db.delete(submissions).where(eq(submissions.id, sub.id));
  await logAudit({
    actorId: student.id,
    actorRole: "student",
    action: "student.assignment_withdrawn",
    entityType: "submission",
    entityId: sub.id,
    summary: `Withdrew submission for “${assignment.title}”`,
  });
  return jsonOk({ id: sub.id });
}
