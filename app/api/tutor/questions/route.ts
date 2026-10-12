import { and, eq } from "drizzle-orm";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { createQuestionSchema } from "@/lib/validators/tutor-tests";
import { requireApiRole } from "@/lib/auth/api-guard";
import { db } from "@/db";
import { batches, courses, questions, tutorAssignments } from "@/db/schema";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import type { CorrectAnswer, QuestionOption } from "@/db/schema";

function buildCorrectAnswer(
  type: "mcq" | "true_false" | "short_answer",
  correctKey: string | null | undefined,
  correctValue: boolean | null | undefined,
  accepted: string[],
): CorrectAnswer {
  if (type === "mcq") return { key: correctKey ?? "" };
  if (type === "true_false") return { value: !!correctValue };
  return { accepted };
}

/** True when the tutor teaches at least one batch of the given course. */
async function tutorTeachesCourse(tutorRowId: string, courseId: string): Promise<boolean> {
  const rows = await db
    .select({ id: batches.id })
    .from(tutorAssignments)
    .innerJoin(batches, eq(tutorAssignments.batchId, batches.id))
    .where(and(eq(tutorAssignments.tutorId, tutorRowId), eq(batches.courseId, courseId)))
    .limit(1);
  return rows.length > 0;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("tutor");
  if (guard.response) return guard.response;
  const tutor = guard.user;
  if (!tutor.tutorRowId) return jsonError("Tutor profile missing", 403);

  const parsed = await parseJsonBody(request, createQuestionSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const d = parsed.data;

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, d.courseId),
    columns: { id: true },
  });
  if (!course) {
    return jsonError("Select an existing course", 422, {
      fieldErrors: { courseId: ["Course not found"] },
    });
  }
  if (!(await tutorTeachesCourse(tutor.tutorRowId, d.courseId))) {
    return jsonError("You can only add questions for courses you teach", 403);
  }

  const options: QuestionOption[] =
    d.type === "mcq"
      ? d.options.map((o) => ({ key: o.key.trim(), text: o.text.trim() }))
      : [];

  const [row] = await db
    .insert(questions)
    .values({
      courseId: d.courseId,
      tutorId: tutor.tutorRowId,
      type: d.type,
      difficulty: d.difficulty,
      topic: d.topic,
      stem: d.stem,
      options,
      correctAnswer: buildCorrectAnswer(d.type, d.correctKey, d.correctValue, d.accepted),
      explanation: d.explanation ?? null,
    })
    .returning({ id: questions.id });

  await logAudit({
    actorId: tutor.id,
    actorRole: "tutor",
    action: "tutor.question_created",
    entityType: "question",
    entityId: row!.id,
    summary: `Added ${d.type} question to bank (${d.topic})`,
  });

  return jsonOk({ id: row!.id });
}
