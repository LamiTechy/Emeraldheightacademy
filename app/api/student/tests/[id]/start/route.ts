import { and, eq, sql } from "drizzle-orm";
import { jsonError, jsonOk } from "@/lib/api";
import { requireApiRole } from "@/lib/auth/api-guard";
import { getTestForStudent } from "@/lib/queries/tutor-tests";
import { db } from "@/db";
import { testAttempts } from "@/db/schema";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

/**
 * Start (or resume) an attempt on a published test.
 * Returns attemptId + expiresAt. One in-progress attempt per student/test.
 */
export async function POST(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("student");
  if (guard.response) return guard.response;
  const student = guard.user;
  if (!student.studentRowId) return jsonError("Student profile missing", 403);

  const { id } = await params;
  const test = await getTestForStudent(id, student.studentRowId);
  if (!test) return jsonError("Test not found or not available", 404);

  const now = new Date();
  if (test.startsAt && now < test.startsAt) {
    return jsonError("This test has not started yet", 422);
  }
  if (test.endsAt && now > test.endsAt) {
    return jsonError("This test is closed", 422);
  }

  // Resume an existing in-progress attempt.
  const active = await db.query.testAttempts.findFirst({
    where: and(
      eq(testAttempts.testId, test.id),
      eq(testAttempts.studentId, student.studentRowId),
      eq(testAttempts.status, "in_progress"),
    ),
  });
  if (active) {
    if (active.expiresAt <= now) {
      // Expired — mark submitted with what was saved (grading happens below via submit route).
      return jsonError("Your previous attempt ran out of time — submit it to see your score", 409, {
        attemptId: active.id,
        expired: true,
      });
    }
    return jsonOk({ id: active.id, resumed: true, expiresAt: active.expiresAt.toISOString() });
  }

  // Attempt limit.
  const [{ n } = { n: 0 }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(testAttempts)
    .where(
      and(eq(testAttempts.testId, test.id), eq(testAttempts.studentId, student.studentRowId)),
    );
  if ((n ?? 0) >= test.attemptsAllowed) {
    return jsonError(`You have used all ${test.attemptsAllowed} attempt(s)`, 422);
  }

  const expiresAt = new Date(now.getTime() + test.durationMinutes * 60_000);
  const [row] = await db
    .insert(testAttempts)
    .values({
      testId: test.id,
      studentId: student.studentRowId,
      attemptNumber: (n ?? 0) + 1,
      status: "in_progress",
      startedAt: now,
      expiresAt,
    })
    .returning({ id: testAttempts.id });

  await logAudit({
    actorId: student.id,
    actorRole: "student",
    action: "student.attempt_started",
    entityType: "test_attempt",
    entityId: row!.id,
    summary: `Started “${test.title}” (attempt ${(n ?? 0) + 1})`,
  });

  return jsonOk({ id: row!.id, resumed: false, expiresAt: expiresAt.toISOString() });
}
