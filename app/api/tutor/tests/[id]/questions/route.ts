import { eq } from "drizzle-orm";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { setTestQuestionsSchema } from "@/lib/validators/tutor-tests";
import { requireApiRole } from "@/lib/auth/api-guard";
import { getOwnedTest, listTestQuestionRows } from "@/lib/queries/tutor-tests";
import { db } from "@/db";
import { questions, testQuestions } from "@/db/schema";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

/** Replace the full question list of a test (order + marks). */
export async function PUT(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("tutor");
  if (guard.response) return guard.response;
  const tutor = guard.user;
  if (!tutor.tutorRowId) return jsonError("Tutor profile missing", 403);

  const { id } = await params;
  const test = await getOwnedTest(id, tutor.tutorRowId);
  if (!test) return jsonError("Test not found", 404);

  if (test.status !== "draft") {
    return jsonError("Only draft tests can have their questions changed", 422, {
      fieldErrors: { status: ["Reopen as draft to edit questions"] },
    });
  }

  const parsed = await parseJsonBody(request, setTestQuestionsSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const items = parsed.data.questions;

  // Dedupe while keeping order.
  const seen = new Set<string>();
  const unique = items.filter((i) => {
    if (seen.has(i.questionId)) return false;
    seen.add(i.questionId);
    return true;
  });

  if (unique.length > 0) {
    const owned = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.courseId, test.courseId));
    const courseQs = new Set(owned.map((q) => q.id));
    const bad = unique.find((i) => !courseQs.has(i.questionId));
    if (bad) {
      return jsonError("All questions must belong to the test's course", 422);
    }
  }

  await db.delete(testQuestions).where(eq(testQuestions.testId, test.id));
  if (unique.length > 0) {
    await db.insert(testQuestions).values(
      unique.map((item, index) => ({
        testId: test.id,
        questionId: item.questionId,
        orderIndex: index,
        marks: String(item.marks),
      })),
    );
  }

  await logAudit({
    actorId: tutor.id,
    actorRole: "tutor",
    action: "tutor.test_questions_set",
    entityType: "test",
    entityId: test.id,
    summary: `Set ${unique.length} question(s) on “${test.title}”`,
  });

  return jsonOk({ count: unique.length });
}

/** Read the current question list (tutor builder). */
export async function GET(_request: Request, { params }: Params) {
  const guard = await requireApiRole("tutor");
  if (guard.response) return guard.response;
  const tutor = guard.user;
  if (!tutor.tutorRowId) return jsonError("Tutor profile missing", 403);

  const { id } = await params;
  const test = await getOwnedTest(id, tutor.tutorRowId);
  if (!test) return jsonError("Test not found", 404);

  const rows = await listTestQuestionRows(test.id);
  return jsonOk({
    status: test.status,
    questions: rows.map((r) => ({
      linkId: r.linkId,
      questionId: r.questionId,
      marks: Number(r.marks),
      orderIndex: r.orderIndex,
      stem: r.q.stem,
      type: r.q.type,
      topic: r.q.topic,
    })),
  });
}
