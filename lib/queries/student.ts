import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  announcements,
  assignments,
  attendance,
  batches,
  courses,
  enrollments,
  materials,
  students,
  submissions,
  testAttempts,
  tests,
  timetableSlots,
} from "@/db/schema";

/** Active enrollments with course + batch + lead tutor names. */
export async function listStudentEnrollments(studentRowId: string) {
  return db
    .select({
      enrollmentId: enrollments.id,
      status: enrollments.status,
      enrolledAt: enrollments.enrolledAt,
      batch: batches,
      course: courses,
    })
    .from(enrollments)
    .innerJoin(batches, eq(enrollments.batchId, batches.id))
    .innerJoin(courses, eq(batches.courseId, courses.id))
    .where(and(eq(enrollments.studentId, studentRowId), eq(enrollments.status, "active")))
    .orderBy(asc(courses.name));
}

/** Batch ids where the student is actively enrolled. */
async function enrolledBatchIds(studentRowId: string): Promise<string[]> {
  const rows = await db
    .select({ batchId: enrollments.batchId })
    .from(enrollments)
    .where(and(eq(enrollments.studentId, studentRowId), eq(enrollments.status, "active")));
  return rows.map((r) => r.batchId);
}

/** Attendance summary per batch + overall counts. */
export async function getAttendanceSummary(studentRowId: string) {
  const rows = await db
    .select({
      batchId: attendance.batchId,
      status: attendance.status,
      n: sql<number>`count(*)::int`,
      batch: batches,
      course: courses,
    })
    .from(attendance)
    .innerJoin(batches, eq(attendance.batchId, batches.id))
    .innerJoin(courses, eq(batches.courseId, courses.id))
    .where(eq(attendance.studentId, studentRowId))
    .groupBy(attendance.batchId, attendance.status, batches.id, courses.id);

  const byBatch = new Map<
    string,
    {
      batchId: string;
      batchCode: string;
      batchName: string;
      courseName: string;
      present: number;
      absent: number;
      late: number;
      excused: number;
      total: number;
      rate: number;
    }
  >();
  let present = 0;
  let total = 0;
  for (const r of rows) {
    const entry = byBatch.get(r.batchId) ?? {
      batchId: r.batchId,
      batchCode: r.batch.code,
      batchName: r.batch.name,
      courseName: r.course.name,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      total: 0,
      rate: 0,
    };
    entry[r.status] += r.n;
    entry.total += r.n;
    if (r.status === "present") present += r.n;
    if (r.status !== "excused") total += r.n;
    byBatch.set(r.batchId, entry);
  }
  for (const e of byBatch.values()) {
    e.rate = e.total === 0 ? 0 : Math.round(((e.present + e.late) / e.total) * 100);
  }
  return {
    batches: [...byBatch.values()],
    present,
    total,
    overallRate: total === 0 ? null : Math.round((present / total) * 100),
  };
}

/** Recent attendance rows (newest first). */
export async function listAttendanceHistory(studentRowId: string, limit = 60) {
  return db
    .select({
      id: attendance.id,
      day: attendance.day,
      status: attendance.status,
      notes: attendance.notes,
      batchCode: batches.code,
      batchName: batches.name,
      courseName: courses.name,
    })
    .from(attendance)
    .innerJoin(batches, eq(attendance.batchId, batches.id))
    .innerJoin(courses, eq(batches.courseId, courses.id))
    .where(eq(attendance.studentId, studentRowId))
    .orderBy(desc(attendance.day))
    .limit(limit);
}

/** Assignments for the student's batches, with their submission (if any). */
export async function listStudentAssignments(studentRowId: string) {
  const batchIds = await enrolledBatchIds(studentRowId);
  if (batchIds.length === 0) return [];

  const rows = await db
    .select({
      a: assignments,
      batch: batches,
      course: courses,
    })
    .from(assignments)
    .innerJoin(batches, eq(assignments.batchId, batches.id))
    .innerJoin(courses, eq(batches.courseId, courses.id))
    .where(and(inArray(assignments.batchId, batchIds), eq(assignments.status, "published")))
    .orderBy(desc(assignments.dueAt));

  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.a.id);
  const subs = await db
    .select()
    .from(submissions)
    .where(and(inArray(submissions.assignmentId, ids), eq(submissions.studentId, studentRowId)));
  const subByAssignment = new Map(subs.map((s) => [s.assignmentId, s]));

  return rows.map((r) => ({
    assignment: r.a,
    batch: r.batch,
    course: r.course,
    submission: subByAssignment.get(r.a.id) ?? null,
  }));
}

/** Materials visible to the student (their courses; batch-limited or whole course). */
export async function listStudentMaterials(studentRowId: string, courseFilter?: string | null) {
  const enrollmentsRows = await db
    .select({ batchId: enrollments.batchId, courseId: batches.courseId })
    .from(enrollments)
    .innerJoin(batches, eq(enrollments.batchId, batches.id))
    .where(and(eq(enrollments.studentId, studentRowId), eq(enrollments.status, "active")));
  if (enrollmentsRows.length === 0) return [];

  const batchIds = enrollmentsRows.map((e) => e.batchId);
  const courseIds = [...new Set(enrollmentsRows.map((e) => e.courseId))];

  const where =
    courseFilter && courseIds.includes(courseFilter)
      ? and(
          eq(materials.courseId, courseFilter),
          sql`(${materials.batchId} is null or ${materials.batchId} in ${batchIds})`,
        )
      : sql`(${materials.courseId} in ${courseIds}) and (${materials.batchId} is null or ${materials.batchId} in ${batchIds})`;

  return db
    .select({ m: materials, course: courses, batch: batches })
    .from(materials)
    .innerJoin(courses, eq(materials.courseId, courses.id))
    .leftJoin(batches, eq(materials.batchId, batches.id))
    .where(where)
    .orderBy(desc(materials.createdAt));
}

/** Test results (graded or submitted attempts) newest first. */
export async function listStudentResults(studentRowId: string) {
  return db
    .select({
      a: testAttempts,
      t: tests,
      course: courses,
    })
    .from(testAttempts)
    .innerJoin(tests, eq(testAttempts.testId, tests.id))
    .innerJoin(courses, eq(tests.courseId, courses.id))
    .where(and(eq(testAttempts.studentId, studentRowId), sql`${testAttempts.status} != 'in_progress'`))
    .orderBy(desc(testAttempts.submittedAt));
}

/** Dashboard aggregates. */
export async function getStudentDashboardStats(studentRowId: string) {
  const batchIds = await enrolledBatchIds(studentRowId);
  const coursesCount = await db
    .select({ n: sql<number>`count(distinct ${batches.courseId})::int` })
    .from(enrollments)
    .innerJoin(batches, eq(enrollments.batchId, batches.id))
    .where(and(eq(enrollments.studentId, studentRowId), eq(enrollments.status, "active")));

  const attendanceSummary = await getAttendanceSummary(studentRowId);

  let dueSoon = 0;
  if (batchIds.length > 0) {
    const due = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(assignments)
      .where(
        and(
          inArray(assignments.batchId, batchIds),
          eq(assignments.status, "published"),
          sql`${assignments.dueAt} >= now()`,
        ),
      );
    dueSoon = due[0]?.n ?? 0;
  }

  const upcomingTests =
    batchIds.length === 0
      ? []
      : await db
          .select({ t: tests, course: courses })
          .from(tests)
          .innerJoin(courses, eq(tests.courseId, courses.id))
          .where(
            and(
              eq(tests.status, "published"),
              sql`((${tests.batchId} is not null and ${tests.batchId} in ${batchIds}) or (${tests.batchId} is null and ${tests.courseId} in (select distinct ${batches.courseId} from ${enrollments} inner join ${batches} on ${enrollments.batchId} = ${batches.id} where ${enrollments.studentId} = ${studentRowId})))`,
            ),
          )
          .orderBy(asc(tests.startsAt))
          .limit(5);

  return {
    coursesCount: coursesCount[0]?.n ?? 0,
    dueSoon,
    attendanceRate: attendanceSummary.overallRate,
    upcomingTests,
  };
}

/** Today's (or given day's) timetable slots for the student's batches. */
export async function listStudentSlots(studentRowId: string, dayOfWeek: number) {
  const batchIds = await enrolledBatchIds(studentRowId);
  if (batchIds.length === 0) return [];
  return db
    .select({ slot: timetableSlots, batch: batches, course: courses })
    .from(timetableSlots)
    .innerJoin(batches, eq(timetableSlots.batchId, batches.id))
    .innerJoin(courses, eq(batches.courseId, courses.id))
    .where(and(inArray(timetableSlots.batchId, batchIds), eq(timetableSlots.dayOfWeek, dayOfWeek)))
    .orderBy(asc(timetableSlots.startTime));
}

/** Full weekly timetable for the student. */
export async function listStudentWeek(studentRowId: string) {
  const batchIds = await enrolledBatchIds(studentRowId);
  if (batchIds.length === 0) return [];
  return db
    .select({ slot: timetableSlots, batch: batches, course: courses })
    .from(timetableSlots)
    .innerJoin(batches, eq(timetableSlots.batchId, batches.id))
    .innerJoin(courses, eq(batches.courseId, courses.id))
    .where(inArray(timetableSlots.batchId, batchIds))
    .orderBy(asc(timetableSlots.dayOfWeek), asc(timetableSlots.startTime));
}

/** Announcements visible to the student (global, student role, their courses/batches). */
export async function listStudentAnnouncements(studentRowId: string, limit = 20) {
  const enrollmentsRows = await db
    .select({ batchId: enrollments.batchId, courseId: batches.courseId })
    .from(enrollments)
    .innerJoin(batches, eq(enrollments.batchId, batches.id))
    .where(and(eq(enrollments.studentId, studentRowId), eq(enrollments.status, "active")));
  const batchIds = enrollmentsRows.map((e) => e.batchId);
  const courseIds = [...new Set(enrollmentsRows.map((e) => e.courseId))];

  const scopeConditions = [
    sql`${announcements.scope} = 'global'`,
    sql`( ${announcements.scope} = 'role' and ${announcements.audienceRole} = 'student' )`,
  ];
  if (courseIds.length > 0) {
    scopeConditions.push(
      sql`( ${announcements.scope} = 'course' and ${announcements.courseId} in ${courseIds} )`,
    );
  }
  if (batchIds.length > 0) {
    scopeConditions.push(
      sql`( ${announcements.scope} = 'batch' and ${announcements.batchId} in ${batchIds} )`,
    );
  }

  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      pinned: announcements.pinned,
      publishAt: announcements.publishAt,
      scope: announcements.scope,
    })
    .from(announcements)
    .where(and(sql`${announcements.publishAt} <= now()`, or(...scopeConditions)))
    .orderBy(desc(announcements.pinned), desc(announcements.publishAt))
    .limit(limit);
}

/** Course progress data for the report: attendance + test averages per course. */
export async function getCourseProgress(studentRowId: string) {
  const enrollmentsRows = await db
    .select({ batchId: enrollments.batchId, courseId: batches.courseId, batch: batches, course: courses })
    .from(enrollments)
    .innerJoin(batches, eq(enrollments.batchId, batches.id))
    .innerJoin(courses, eq(batches.courseId, courses.id))
    .where(and(eq(enrollments.studentId, studentRowId), eq(enrollments.status, "active")));

  const courseMap = new Map<
    string,
    {
      courseId: string;
      courseName: string;
      courseCode: string;
      batches: string[];
      present: number;
      total: number;
      attendanceRate: number | null;
      testScores: { title: string; score: number; max: number; date: string }[];
      testAverage: number | null;
    }
  >();
  for (const e of enrollmentsRows) {
    const entry = courseMap.get(e.courseId) ?? {
      courseId: e.courseId,
      courseName: e.course.name,
      courseCode: e.course.code,
      batches: [],
      present: 0,
      total: 0,
      attendanceRate: null,
      testScores: [],
      testAverage: null,
    };
    if (!entry.batches.includes(e.batch.code)) entry.batches.push(e.batch.code);
    courseMap.set(e.courseId, entry);
  }
  if (courseMap.size === 0) return [];

  const courseIds = [...courseMap.keys()];
  const att = await db
    .select({ courseId: batches.courseId, status: attendance.status, n: sql<number>`count(*)::int` })
    .from(attendance)
    .innerJoin(batches, eq(attendance.batchId, batches.id))
    .where(and(eq(attendance.studentId, studentRowId), inArray(batches.courseId, courseIds)))
    .groupBy(batches.courseId, attendance.status);
  for (const r of att) {
    const entry = courseMap.get(r.courseId);
    if (!entry) continue;
    entry.total += r.n;
    if (r.status === "present") entry.present += r.n;
  }

  const results = await db
    .select({ a: testAttempts, t: tests, courseId: courses.id })
    .from(testAttempts)
    .innerJoin(tests, eq(testAttempts.testId, tests.id))
    .innerJoin(courses, eq(tests.courseId, courses.id))
    .where(
      and(
        eq(testAttempts.studentId, studentRowId),
        sql`${testAttempts.status} = 'graded'`,
        inArray(courses.id, courseIds),
      ),
    )
    .orderBy(asc(testAttempts.submittedAt));
  for (const r of results) {
    const entry = courseMap.get(r.courseId);
    if (!entry || r.a.totalScore === null || r.a.maxScore === null) continue;
    const max = Number(r.a.maxScore);
    const score = Number(r.a.totalScore);
    entry.testScores.push({
      title: r.t.title,
      score,
      max,
      date: r.a.submittedAt?.toISOString().slice(0, 10) ?? "",
    });
  }

  for (const entry of courseMap.values()) {
    entry.attendanceRate = entry.total === 0 ? null : Math.round((entry.present / entry.total) * 100);
    entry.testAverage =
      entry.testScores.length === 0
        ? null
        : Math.round(
            (entry.testScores.reduce((a, s) => a + (s.max === 0 ? 0 : (s.score / s.max) * 100), 0) /
              entry.testScores.length) * 10,
          ) / 10;
  }
  return [...courseMap.values()];
}

/** Identity block for the printable progress report. */
export async function getStudentProfile(studentRowId: string) {
  const row = await db.query.students.findFirst({
    where: eq(students.id, studentRowId),
    with: { user: { columns: { name: true, email: true, avatarUrl: true } } },
  });
  return row;
}
