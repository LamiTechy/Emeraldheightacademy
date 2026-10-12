import "server-only";
import { and, asc, desc, eq, inArray, isNull, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  batches,
  courses,
  enrollments,
  settings,
  students,
  tests,
  timetableSlots,
  tutors,
  users,
} from "@/db/schema";
import type {
  batchStatusEnum,
  courseStatusEnum,
  enrollmentStatusEnum,
  userRoleEnum,
  userStatusEnum,
} from "@/db/schema";

type RoleFilter = (typeof userRoleEnum.enumValues)[number] | undefined;
type UserStatusFilter = (typeof userStatusEnum.enumValues)[number] | undefined;
type CourseStatusFilter = (typeof courseStatusEnum.enumValues)[number] | undefined;
type BatchStatusFilter = (typeof batchStatusEnum.enumValues)[number] | undefined;
type EnrollmentStatusFilter = (typeof enrollmentStatusEnum.enumValues)[number] | undefined;

export async function listUsers(filters?: {
  role?: RoleFilter;
  status?: UserStatusFilter;
  q?: string;
}) {
  const conditions: SQL[] = [isNull(users.deletedAt)];
  if (filters?.role) conditions.push(eq(users.role, filters.role));
  if (filters?.status) conditions.push(eq(users.status, filters.status));
  if (filters?.q?.trim()) {
    const q = `%${filters.q.trim().replace(/[%_]/g, "")}%`;
    conditions.push(sql`${users.name} ILIKE ${q} OR ${users.email} ILIKE ${q}`);
  }

  return db.query.users.findMany({
    where: and(...conditions),
    columns: {
      id: true,
      role: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      mustChangePassword: true,
      avatarUrl: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
    with: {
      student: {
        columns: {
          studentId: true,
          educationLevel: true,
          gender: true,
          school: true,
          guardianName: true,
          guardianPhone: true,
          isMinor: true,
        },
      },
      tutor: {
        columns: { tutorId: true, bio: true, qualifications: true, specialties: true },
      },
    },
    orderBy: [sql`${users.name} asc`],
  });
}

export async function listCourses(status?: CourseStatusFilter) {
  const rows = await db.query.courses.findMany({
    where: status ? eq(courses.status, status) : undefined,
    orderBy: [sql`${courses.sortOrder} asc`, sql`${courses.name} asc`],
  });

  const counts = await db
    .select({ courseId: batches.courseId, n: sql<number>`count(*)::int` })
    .from(batches)
    .groupBy(batches.courseId);
  const countMap = new Map(counts.map((c) => [c.courseId, c.n]));

  return rows.map((row) => ({ ...row, batchCount: countMap.get(row.id) ?? 0 }));
}

export async function listBatches(filters?: {
  status?: BatchStatusFilter;
  courseId?: string;
}) {
  const conditions: SQL[] = [];
  if (filters?.status) conditions.push(eq(batches.status, filters.status));
  if (filters?.courseId) conditions.push(eq(batches.courseId, filters.courseId));

  const rows = await db.query.batches.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: {
      course: { columns: { id: true, name: true, code: true, category: true } },
      tutorAssignments: {
        with: { tutor: { columns: { id: true, tutorId: true }, with: { user: { columns: { name: true } } } } },
      },
    },
    orderBy: [sql`${batches.startDate} desc`, sql`${batches.code} asc`],
  });

  const activeCounts = await db
    .select({ batchId: enrollments.batchId, n: sql<number>`count(*)::int` })
    .from(enrollments)
    .where(eq(enrollments.status, "active"))
    .groupBy(enrollments.batchId);
  const countMap = new Map(activeCounts.map((c) => [c.batchId, c.n]));

  return rows.map((row) => ({ ...row, enrolledCount: countMap.get(row.id) ?? 0 }));
}

export async function listEnrollments(filters?: {
  batchId?: string;
  status?: EnrollmentStatusFilter;
  q?: string;
}) {
  const conditions: SQL[] = [];
  if (filters?.batchId) conditions.push(eq(enrollments.batchId, filters.batchId));
  if (filters?.status) conditions.push(eq(enrollments.status, filters.status));
  if (filters?.q?.trim()) {
    const q = `%${filters.q.trim().replace(/[%_]/g, "")}%`;
    conditions.push(
      sql`${users.name} ILIKE ${q} OR ${users.email} ILIKE ${q} OR ${students.studentId} ILIKE ${q}`,
    );
  }

  return db.query.enrollments.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: {
      student: {
        columns: { id: true, studentId: true },
        with: { user: { columns: { id: true, name: true, email: true } } },
      },
      batch: {
        columns: { id: true, code: true, name: true },
        with: { course: { columns: { name: true, category: true } } },
      },
    },
    orderBy: [sql`${enrollments.enrolledAt} desc`],
  });
}

export async function listSlots() {
  return db.query.timetableSlots.findMany({
    with: {
      batch: {
        columns: { id: true, code: true, name: true },
        with: { course: { columns: { name: true, category: true } } },
      },
      tutor: {
        columns: { id: true, tutorId: true },
        with: { user: { columns: { name: true } } },
      },
    },
    orderBy: [sql`${timetableSlots.dayOfWeek} asc`, sql`${timetableSlots.startTime} asc`],
  });
}

export type SelectOptions = Awaited<ReturnType<typeof getSelectOptions>>;

export async function getSelectOptions() {
  const [studentRows, tutorRows, courseRows, batchRows, activeCounts] = await Promise.all([
    db.query.students.findMany({
      with: { user: { columns: { id: true, name: true, email: true, status: true } } },
      orderBy: [sql`${students.studentId} asc`],
    }),
    db.query.tutors.findMany({
      with: { user: { columns: { id: true, name: true } } },
      orderBy: [sql`${tutors.tutorId} asc`],
    }),
    db.query.courses.findMany({
      orderBy: [sql`${courses.sortOrder} asc`, sql`${courses.name} asc`],
    }),
    db.query.batches.findMany({
      columns: { id: true, code: true, name: true, courseId: true, capacity: true, status: true },
      orderBy: [sql`${batches.code} asc`],
    }),
    db.select({ batchId: enrollments.batchId, n: sql<number>`count(*)::int` })
      .from(enrollments)
      .where(eq(enrollments.status, "active"))
      .groupBy(enrollments.batchId),
  ]);

  const countMap = new Map(activeCounts.map((c) => [c.batchId, c.n]));

  return {
    students: studentRows.map((s) => ({
      userId: s.user.id,
      studentRowId: s.id,
      studentId: s.studentId,
      name: s.user.name,
      email: s.user.email,
      status: s.user.status,
    })),
    tutors: tutorRows.map((t) => ({
      tutorRowId: t.id,
      tutorId: t.tutorId,
      name: t.user.name,
    })),
    courses: courseRows.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      status: c.status,
    })),
    batches: batchRows.map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      courseId: b.courseId,
      capacity: b.capacity,
      status: b.status,
      enrolled: countMap.get(b.id) ?? 0,
    })),
  };
}

/** Users targeted by role-specific selects (create user forms, etc.). */
export async function getTutorUsers() {
  const rows = await db.query.users.findMany({
    where: and(eq(users.role, "tutor"), eq(users.status, "active"), isNull(users.deletedAt)),
    columns: { id: true, name: true },
    orderBy: [sql`${users.name} asc`],
  });
  return rows;
}

export async function getUsersByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return db.query.users.findMany({ where: inArray(users.id, ids) });
}

/** Headline numbers for the admin dashboard's stat cards. */
export async function adminDashboardCounts() {
  const [activeUsers, activeEnrollments, runningBatches, liveTests] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(users)
      .where(and(eq(users.status, "active"), isNull(users.deletedAt))),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(enrollments)
      .where(eq(enrollments.status, "active")),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(batches)
      .where(eq(batches.status, "active")),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(tests)
      .where(eq(tests.status, "published")),
  ]);
  return {
    activeUsers: activeUsers[0]?.n ?? 0,
    activeEnrollments: activeEnrollments[0]?.n ?? 0,
    runningBatches: runningBatches[0]?.n ?? 0,
    liveTests: liveTests[0]?.n ?? 0,
  };
}

/** Recent audit trail with actor identity (newest first, capped at 500). */
export async function listAuditLogs(filters?: { role?: RoleFilter }) {
  const conditions: SQL[] = [];
  if (filters?.role) conditions.push(eq(auditLogs.actorRole, filters.role));

  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      summary: auditLogs.summary,
      metadata: auditLogs.metadata,
      ip: auditLogs.ip,
      userAgent: auditLogs.userAgent,
      actorRole: auditLogs.actorRole,
      actorName: users.name,
      actorEmail: users.email,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(500);
}

/** All site setting rows with the user who last updated them. */
export async function listSettingsRows() {
  return db
    .select({
      key: settings.key,
      value: settings.value,
      updatedAt: settings.updatedAt,
      updatedByName: users.name,
    })
    .from(settings)
    .leftJoin(users, eq(settings.updatedBy, users.id))
    .orderBy(asc(settings.key));
}
