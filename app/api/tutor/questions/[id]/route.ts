import { eq } from "drizzle-orm";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { updateQuestionSchema } from "@/lib/validators/tutor-tests";
import { requireApiRole } from "@/lib/auth/api-guard";
import { deleteQuestionIfUnused } from "@/lib/grading";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import type { CorrectAnswer, QuestionOption } from "@/db/schema";

type Params = { params: Promise<{ id: string }> };

async function loadOwnedQuestion(id: string, tutorRowId: string) {
  const row = await db.query.questions.findFirst({
    where: eq(questions.id, id),
    columns: { id: true, tutorId: true, type: true, topic: true },
  });
  if (!row || row.tutorId !== tutorRowId) return null;
  return row;
}

export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("tutor");
  if (guard.response) return guard.response;
  const tutor = guard.user;
  if (!tutor.tutorRowId) return jsonError("Tutor profile missing", 403);

  const { id } = await params;
  const existing = await loadOwnedQuestion(id, tutor.tutorRowId);
  if (!existing) return jsonError("Question not found", 404);

  const parsed = await parseJsonBody(request, updateQuestionSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const d = parsed.data;

  const set: Partial<typeof questions.$inferInsert> = {};
  if (d.courseId !== undefined) set.courseId = d.courseId;
  if (d.type !== undefined) set.type = d.type;
  if (d.difficulty !== undefined) set.difficulty = d.difficulty;
  if (d.topic !== undefined) set.topic = d.topic;
  if (d.stem !== undefined) set.stem = d.stem;

  const type = d.type ?? existing.type;
  if (d.options !== undefined) {
    const options: QuestionOption[] =
      type === "mcq" ? d.options.map((o) => ({ key: o.key.trim(), text: o.text.trim() })) : [];
    set.options = options;
  }
  if (d.correctKey !== undefined || d.correctValue !== undefined || d.accepted !== undefined) {
    const correct: CorrectAnswer =
      type === "mcq"
        ? { key: d.correctKey ?? "" }
        : type === "true_false"
          ? { value: !!d.correctValue }
          : { accepted: d.accepted ?? [] };
    set.correctAnswer = correct;
  }
  if (d.explanation !== undefined) set.explanation = d.explanation ?? null;
  set.updatedAt = new Date();

  await db.update(questions).set(set).where(eq(questions.id, existing.id));

  await logAudit({
    actorId: tutor.id,
    actorRole: "tutor",
    action: "tutor.question_updated",
    entityType: "question",
    entityId: existing.id,
    summary: `Updated question (${d.topic ?? existing.topic})`,
  });

  return jsonOk({ id: existing.id });
}

export async function DELETE(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("tutor");
  if (guard.response) return guard.response;
  const tutor = guard.user;
  if (!tutor.tutorRowId) return jsonError("Tutor profile missing", 403);

  const { id } = await params;
  const existing = await loadOwnedQuestion(id, tutor.tutorRowId);
  if (!existing) return jsonError("Question not found", 404);

  const result = await deleteQuestionIfUnused(existing.id);
  if (result === "in-use") {
    return jsonError("This question is used in an attempted test and cannot be deleted", 409);
  }

  await logAudit({
    actorId: tutor.id,
    actorRole: "tutor",
    action: "tutor.question_deleted",
    entityType: "question",
    entityId: existing.id,
    summary: `Deleted question (${existing.topic})`,
  });

  return jsonOk({ id: existing.id });
}
