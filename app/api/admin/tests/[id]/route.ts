import { eq } from "drizzle-orm";
import { z } from "zod";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { requireApiRole } from "@/lib/auth/api-guard";
import { db } from "@/db";
import { testQuestions, testStatusEnum, tests } from "@/db/schema";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

const statusSchema = z.object({ status: z.enum(testStatusEnum.enumValues) });

/** Admin moderation: publish / close / reopen any tutor's test. */
export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;

  const { id } = await params;
  const test = await db.query.tests.findFirst({ where: eq(tests.id, id) });
  if (!test) return jsonError("Test not found", 404);

  const parsed = await parseJsonBody(request, statusSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const { status } = parsed.data;

  if (status === "published") {
    const [row] = await db
      .select({ id: testQuestions.id })
      .from(testQuestions)
      .where(eq(testQuestions.testId, id))
      .limit(1);
    if (!row) {
      return jsonError("This test has no questions yet — ask the tutor to add some first", 422, {
        fieldErrors: { _: ["Test has no questions"] },
      });
    }
  }

  await db.update(tests).set({ status, updatedAt: new Date() }).where(eq(tests.id, id));

  await logAudit({
    actorId: guard.user.id,
    actorRole: "admin",
    action: "admin.test_status_changed",
    entityType: "test",
    entityId: id,
    summary: `Changed “${test.title}” from ${test.status} to ${status}`,
  });

  return jsonOk({ id, status });
}
