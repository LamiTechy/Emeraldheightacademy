import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { enrollments, tutorAssignments, batches } from "@/db/schema";
import type { Role } from "@/lib/auth/jwt";

/** Route prefixes each role is allowed to enter. */
export const ROLE_PREFIXES: Record<Role, string[]> = {
  student: ["/student"],
  tutor: ["/tutor"],
  admin: ["/student", "/tutor", "/admin"],
};

export function canAccessPath(role: Role, pathname: string): boolean {
  return ROLE_PREFIXES[role].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Batch ids a tutor is assigned to. Every tutor-scoped query must filter by this. */
export async function getTutorBatchIds(tutorRowId: string): Promise<string[]> {
  const rows = await db
    .select({ batchId: tutorAssignments.batchId })
    .from(tutorAssignments)
    .where(eq(tutorAssignments.tutorId, tutorRowId));
  return rows.map((row) => row.batchId);
}

export async function isTutorAssignedToBatch(tutorRowId: string, batchId: string): Promise<boolean> {
  const rows = await getTutorBatchIds(tutorRowId);
  return rows.includes(batchId);
}

/** Batch ids a student is actively enrolled in. */
export async function getStudentBatchIds(studentRowId: string): Promise<string[]> {
  const rows = await db
    .select({ batchId: enrollments.batchId })
    .from(enrollments)
    .where(and(eq(enrollments.studentId, studentRowId), eq(enrollments.status, "active")));
  return rows.map((row) => row.batchId);
}

export async function isStudentInBatch(studentRowId: string, batchId: string): Promise<boolean> {
  const rows = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.studentId, studentRowId),
        eq(enrollments.batchId, batchId),
        eq(enrollments.status, "active"),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

/** Course ids visible to a student through active enrollments. */
export async function getStudentCourseIds(studentRowId: string): Promise<string[]> {
  const batchIds = await getStudentBatchIds(studentRowId);
  if (batchIds.length === 0) return [];
  const rows = await db
    .select({ courseId: batches.courseId })
    .from(batches)
    .where(inArray(batches.id, batchIds));
  return [...new Set(rows.map((row) => row.courseId))];
}
