import "server-only";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  batches,
  courses,
  testAttempts,
  testQuestions,
  testStatusEnum,
  tests,
  tutors,
  users,
} from "@/db/schema";

type TestStatus = (typeof testStatusEnum.enumValues)[number];

/** Every test across all tutors, with author, course/batch and counts. */
export async function listAllTests(status?: string | null) {
  const rows = await db
    .select({ t: tests, course: courses, batch: batches, tutorName: users.name })
    .from(tests)
    .innerJoin(courses, eq(tests.courseId, courses.id))
    .leftJoin(batches, eq(tests.batchId, batches.id))
    .innerJoin(tutors, eq(tests.tutorId, tutors.id))
    .innerJoin(users, eq(tutors.userId, users.id))
    .where(status ? eq(tests.status, status as TestStatus) : undefined)
    .orderBy(desc(tests.createdAt));

  if (rows.length === 0) {
    return { rows: [], qCounts: new Map<string, number>(), aCounts: new Map<string, number>() };
  }
  const ids = rows.map((r) => r.t.id);
  const [qRows, aRows] = await Promise.all([
    db
      .select({ testId: testQuestions.testId, n: sql<number>`count(*)::int` })
      .from(testQuestions)
      .where(inArray(testQuestions.testId, ids))
      .groupBy(testQuestions.testId),
    db
      .select({ testId: testAttempts.testId, n: sql<number>`count(*)::int` })
      .from(testAttempts)
      .where(inArray(testAttempts.testId, ids))
      .groupBy(testAttempts.testId),
  ]);

  return {
    rows,
    qCounts: new Map(qRows.map((r) => [r.testId, r.n])),
    aCounts: new Map(aRows.map((r) => [r.testId, r.n])),
  };
}

/** Headline test numbers for the admin tests page. */
export async function adminTestStats() {
  const [byStatus, attempts] = await Promise.all([
    db.select({ status: tests.status, n: sql<number>`count(*)::int` }).from(tests).groupBy(tests.status),
    db.select({ n: sql<number>`count(*)::int` }).from(testAttempts),
  ]);
  const map = new Map(byStatus.map((r) => [r.status, r.n]));
  return {
    total: byStatus.reduce((a, r) => a + r.n, 0),
    draft: map.get("draft") ?? 0,
    published: map.get("published") ?? 0,
    closed: map.get("closed") ?? 0,
    attempts: attempts[0]?.n ?? 0,
  };
}
