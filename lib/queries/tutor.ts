import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  assignments,
  attendance,
  batches,
  courses,
  enrollments,
  materials,
  submissions,
  students,
  testAttempts,
  tests,
  timetableSlots,
  tutorAssignments,
  users,
} from "@/db/schema";

/** Batches this tutor teaches (via tutor_assignments), with course info. */
export async function listTutorBatches(tutorRowId: string) {
  return db
    .select({ batch: batches, course: courses })
    .from(tutorAssignments)
    .innerJoin(batches, eq(tutorAssignments.batchId, batches.id))
    .innerJoin(courses, eq(batches.courseId, courses.id))
    .where(eq(tutorAssignments.tutorId, tutorRowId))
    .orderBy(asc(batches.name));
}

/** True when the given batch is taught by the given tutor. */
export async function tutorOwnsBatch(tutorRowId: string, batchId: string): Promise<boolean> {
  const rows = await db
    .select({ id: tutorAssignments.id })
    .from(tutorAssignments)
    .where(and(eq(tutorAssignments.tutorId, tutorRowId), eq(tutorAssignments.batchId, batchId)))
    .limit(1);
  return rows.length > 0;
}

/** Active students enrolled in a batch. */
export async function listBatchRoster(batchId: string) {
  return db
    .select({
      enrollmentId: enrollments.id,
      studentId: students.id,
      studentCode: students.studentId,
      name: users.name,
      email: users.email,
    })
    .from(enrollments)
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .innerJoin(users, eq(students.userId, users.id))
    .where(
      and(eq(enrollments.batchId, batchId), eq(enrollments.status, "active"), eq(users.status, "active")),
    )
    .orderBy(asc(users.name));
}

/** Attendance already recorded for a batch on a given day. */
export async function listAttendanceForDay(batchId: string, day: string) {
  return db
    .select({
      studentId: attendance.studentId,
      status: attendance.status,
      notes: attendance.notes,
    })
    .from(attendance)
    .where(and(eq(attendance.batchId, batchId), eq(attendance.day, day)));
}

/** This tutor's assignments (newest first) with batch/course labels and counts. */
export async function listTutorAssignments(tutorRowId: string) {
  const rows = await db
    .select({ a: assignments, batch: batches, course: courses })
    .from(assignments)
    .innerJoin(batches, eq(assignments.batchId, batches.id))
    .innerJoin(courses, eq(batches.courseId, courses.id))
    .where(eq(assignments.tutorId, tutorRowId))
    .orderBy(desc(assignments.createdAt));

  if (rows.length === 0) {
    return { rows: [], stats: new Map<string, { submitted: number; graded: number }>() };
  }

  const ids = rows.map((r) => r.a.id);
  const statsRows = await db
    .select({
      assignmentId: submissions.assignmentId,
      submitted: sql<number>`count(*)::int`,
      graded: sql<number>`count(*) filter (where ${submissions.status} = 'graded')::int`,
    })
    .from(submissions)
    .where(inArray(submissions.assignmentId, ids))
    .groupBy(submissions.assignmentId);

  const stats = new Map(
    statsRows.map((s) => [s.assignmentId, { submitted: s.submitted, graded: s.graded }]),
  );
  return { rows, stats };
}

/** Active-enrollment counts per batch (for roster totals). */
export async function countBatchRosters(batchIds: string[]): Promise<Map<string, number>> {
  if (batchIds.length === 0) return new Map();
  const rows = await db
    .select({ batchId: enrollments.batchId, n: sql<number>`count(*)::int` })
    .from(enrollments)
    .where(and(inArray(enrollments.batchId, batchIds), eq(enrollments.status, "active")))
    .groupBy(enrollments.batchId);
  return new Map(rows.map((r) => [r.batchId, r.n]));
}

/** Submissions for one assignment, with student identities. */
export async function listSubmissions(assignmentId: string) {
  return db
    .select({
      s: submissions,
      studentId: students.id,
      studentCode: students.studentId,
      name: users.name,
      email: users.email,
    })
    .from(submissions)
    .innerJoin(students, eq(submissions.studentId, students.id))
    .innerJoin(users, eq(students.userId, users.id))
    .where(eq(submissions.assignmentId, assignmentId))
    .orderBy(asc(users.name));
}

/** This tutor's materials (newest first) with course/batch labels. */
export async function listTutorMaterials(tutorRowId: string) {
  return db
    .select({ m: materials, course: courses, batch: batches })
    .from(materials)
    .innerJoin(courses, eq(materials.courseId, courses.id))
    .leftJoin(batches, eq(materials.batchId, batches.id))
    .where(eq(materials.tutorId, tutorRowId))
    .orderBy(desc(materials.createdAt));
}

/** Courses (with their batches) this tutor teaches — for material/assignment forms. */
export async function listTutorCourseTree(tutorRowId: string) {
  const rows = await listTutorBatches(tutorRowId);
  const byCourse = new Map<
    string,
    { id: string; name: string; batches: { id: string; name: string; code: string }[] }
  >();
  for (const r of rows) {
    const course = byCourse.get(r.course.id) ?? { id: r.course.id, name: r.course.name, batches: [] };
    course.batches.push({ id: r.batch.id, name: r.batch.name, code: r.batch.code });
    byCourse.set(r.course.id, course);
  }
  return [...byCourse.values()];
}

/** Today's timetable slots for a tutor (by day-of-week). */
export async function listSlotsForDay(tutorRowId: string, dayOfWeek: number) {
  return db
    .select({ slot: timetableSlots, batch: batches, course: courses })
    .from(timetableSlots)
    .innerJoin(batches, eq(timetableSlots.batchId, batches.id))
    .innerJoin(courses, eq(batches.courseId, courses.id))
    .where(and(eq(timetableSlots.tutorId, tutorRowId), eq(timetableSlots.dayOfWeek, dayOfWeek)))
    .orderBy(asc(timetableSlots.startTime));
}

/** Full week of teaching slots for a tutor, ordered by day then start time. */
export async function listTutorWeek(tutorRowId: string) {
  return db
    .select({ slot: timetableSlots, batch: batches, course: courses })
    .from(timetableSlots)
    .innerJoin(batches, eq(timetableSlots.batchId, batches.id))
    .innerJoin(courses, eq(batches.courseId, courses.id))
    .where(eq(timetableSlots.tutorId, tutorRowId))
    .orderBy(asc(timetableSlots.dayOfWeek), asc(timetableSlots.startTime));
}

/**
 * Every active student across this tutor's batches, with progress:
 * graded attempts on the tutor's tests, submissions to the tutor's
 * assignments, and attendance recorded in the tutor's batches.
 * One row per student (merged across batches), ordered by name.
 */
export async function listTutorStudents(tutorRowId: string) {
  const roster = await db
    .select({
      studentId: students.id,
      studentCode: students.studentId,
      name: users.name,
      email: users.email,
      batchCode: batches.code,
      batchName: batches.name,
      enrolledAt: enrollments.enrolledAt,
    })
    .from(tutorAssignments)
    .innerJoin(batches, eq(tutorAssignments.batchId, batches.id))
    .innerJoin(enrollments, eq(enrollments.batchId, batches.id))
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .innerJoin(users, eq(users.id, students.userId))
    .where(
      and(
        eq(tutorAssignments.tutorId, tutorRowId),
        eq(enrollments.status, "active"),
        eq(users.status, "active"),
      ),
    )
    .orderBy(asc(users.name), asc(batches.name));

  if (roster.length === 0) return [];

  const studentIds = [...new Set(roster.map((r) => r.studentId))];

  const attemptRows = await db
    .select({
      studentId: testAttempts.studentId,
      graded: sql<number>`count(*) filter (where ${testAttempts.status} = 'graded')::int`,
      avgPct: sql<number | null>`round(avg(${testAttempts.totalScore} / nullif(${testAttempts.maxScore}, 0) * 100) filter (where ${testAttempts.status} = 'graded'), 1)::float`,
    })
    .from(testAttempts)
    .innerJoin(tests, eq(tests.id, testAttempts.testId))
    .where(and(eq(tests.tutorId, tutorRowId), inArray(testAttempts.studentId, studentIds)))
    .groupBy(testAttempts.studentId);

  const availableRows = await db
    .select({ studentId: enrollments.studentId, n: sql<number>`count(distinct ${assignments.id})::int` })
    .from(enrollments)
    .innerJoin(assignments, eq(assignments.batchId, enrollments.batchId))
    .where(
      and(
        eq(assignments.tutorId, tutorRowId),
        eq(enrollments.status, "active"),
        inArray(enrollments.studentId, studentIds),
      ),
    )
    .groupBy(enrollments.studentId);

  const submittedRows = await db
    .select({ studentId: submissions.studentId, n: sql<number>`count(distinct ${submissions.assignmentId})::int` })
    .from(submissions)
    .innerJoin(assignments, eq(assignments.id, submissions.assignmentId))
    .where(and(eq(assignments.tutorId, tutorRowId), inArray(submissions.studentId, studentIds)))
    .groupBy(submissions.studentId);

  const attendanceRows = await db
    .select({
      studentId: attendance.studentId,
      present: sql<number>`count(*) filter (where ${attendance.status} = 'present')::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(attendance)
    .innerJoin(tutorAssignments, eq(tutorAssignments.batchId, attendance.batchId))
    .where(and(eq(tutorAssignments.tutorId, tutorRowId), inArray(attendance.studentId, studentIds)))
    .groupBy(attendance.studentId);

  const attemptsBy = new Map(attemptRows.map((r) => [r.studentId, r]));
  const availableBy = new Map(availableRows.map((r) => [r.studentId, r.n]));
  const submittedBy = new Map(submittedRows.map((r) => [r.studentId, r.n]));
  const attendanceBy = new Map(attendanceRows.map((r) => [r.studentId, r]));

  const merged = new Map<
    string,
    {
      studentId: string;
      studentCode: string;
      name: string;
      email: string;
      batches: { code: string; name: string }[];
      enrolledAt: Date;
      gradedAttempts: number;
      avgScore: number | null;
      assignmentsAvailable: number;
      assignmentsSubmitted: number;
      presentCount: number;
      attendanceTotal: number;
    }
  >();

  for (const r of roster) {
    let row = merged.get(r.studentId);
    if (!row) {
      const attempts = attemptsBy.get(r.studentId);
      const att = attendanceBy.get(r.studentId);
      row = {
        studentId: r.studentId,
        studentCode: r.studentCode,
        name: r.name,
        email: r.email,
        batches: [],
        enrolledAt: r.enrolledAt,
        gradedAttempts: attempts?.graded ?? 0,
        avgScore: attempts?.avgPct ?? null,
        assignmentsAvailable: availableBy.get(r.studentId) ?? 0,
        assignmentsSubmitted: submittedBy.get(r.studentId) ?? 0,
        presentCount: att?.present ?? 0,
        attendanceTotal: att?.total ?? 0,
      };
      merged.set(r.studentId, row);
    }
    if (!row.batches.some((b) => b.code === r.batchCode)) {
      row.batches.push({ code: r.batchCode, name: r.batchName });
    }
    if (r.enrolledAt < row.enrolledAt) row.enrolledAt = r.enrolledAt;
  }

  return [...merged.values()];
}

/** Dashboard aggregates: unique students taught, ungraded submissions, assignment count. */
export async function getTutorStats(tutorRowId: string, batchIds: string[]) {
  const studentsTaught =
    batchIds.length === 0
      ? 0
      : (
          await db
            .select({ n: sql<number>`count(distinct ${enrollments.studentId})::int` })
            .from(enrollments)
            .where(inArray(enrollments.batchId, batchIds))
        )[0]?.n ?? 0;

  const awaitingGrading =
    (
      await db
        .select({ n: sql<number>`count(*)::int` })
        .from(submissions)
        .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
        .where(and(eq(assignments.tutorId, tutorRowId), eq(submissions.status, "submitted")))
    )[0]?.n ?? 0;

  const assignmentsCount =
    (
      await db
        .select({ n: sql<number>`count(*)::int` })
        .from(assignments)
        .where(eq(assignments.tutorId, tutorRowId))
    )[0]?.n ?? 0;

  return { studentsTaught, awaitingGrading, assignmentsCount };
}
