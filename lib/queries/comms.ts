import { and, asc, desc, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  announcements,
  batches,
  courses,
  enrollments,
  messages,
  tutorAssignments,
  users,
} from "@/db/schema";

// ── Announcements ────────────────────────────────────────────────────────────

/** Admin: all announcements with author/course/batch labels. */
export async function listAllAnnouncements() {
  return db
    .select({
      a: announcements,
      authorName: users.name,
      courseName: courses.name,
      batchCode: batches.code,
    })
    .from(announcements)
    .leftJoin(users, eq(announcements.authorId, users.id))
    .leftJoin(courses, eq(announcements.courseId, courses.id))
    .leftJoin(batches, eq(announcements.batchId, batches.id))
    .orderBy(desc(announcements.pinned), desc(announcements.publishAt));
}

/** Announcements visible to a role (published & scoped). */
export async function listAnnouncementsForRole(
  role: "student" | "tutor" | "admin",
  opts: { studentRowId?: string | null } = {},
) {
  const courseIds: string[] = [];
  const batchIds: string[] = [];
  if (opts.studentRowId) {
    const rows = await db
      .select({ batchId: enrollments.batchId, courseId: batches.courseId })
      .from(enrollments)
      .innerJoin(batches, eq(enrollments.batchId, batches.id))
      .where(and(eq(enrollments.studentId, opts.studentRowId), eq(enrollments.status, "active")));
    for (const r of rows) {
      batchIds.push(r.batchId);
      courseIds.push(r.courseId);
    }
  }

  const scopeConditions = [
    sql`${announcements.scope} = 'global'`,
    sql`( ${announcements.scope} = 'role' and ${announcements.audienceRole} = ${role} )`,
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
      a: announcements,
      authorName: users.name,
      courseName: courses.name,
      batchCode: batches.code,
    })
    .from(announcements)
    .leftJoin(users, eq(announcements.authorId, users.id))
    .leftJoin(courses, eq(announcements.courseId, courses.id))
    .leftJoin(batches, eq(announcements.batchId, batches.id))
    .where(and(sql`${announcements.publishAt} <= now()`, or(...scopeConditions)))
    .orderBy(desc(announcements.pinned), desc(announcements.publishAt));
}

/** Courses + batches a tutor teaches (for scoping their announcements). */
export async function listTutorScopeOptions(tutorRowId: string) {
  return db
    .select({ batch: batches, course: courses })
    .from(tutorAssignments)
    .innerJoin(batches, eq(tutorAssignments.batchId, batches.id))
    .innerJoin(courses, eq(batches.courseId, courses.id))
    .where(eq(tutorAssignments.tutorId, tutorRowId))
    .orderBy(asc(courses.name), asc(batches.code));
}

/** All courses + batches for the admin scope picker. */
export async function listScopeOptions() {
  const [courseRows, batchRows] = await Promise.all([
    db.select().from(courses).orderBy(asc(courses.name)),
    db
      .select({ batch: batches, course: courses })
      .from(batches)
      .innerJoin(courses, eq(batches.courseId, courses.id))
      .orderBy(asc(courses.name), asc(batches.code)),
  ]);
  return { courses: courseRows, batches: batchRows };
}

// ── Messages ─────────────────────────────────────────────────────────────────

const senderCols = sql<string>`(select u2.name from ${users} u2 where u2.id = ${messages.senderId})`.as("sender_name");
const senderRoleCols = sql<string>`(select u2.role from ${users} u2 where u2.id = ${messages.senderId})`.as("sender_role");
const recipientCols = sql<string>`(select u2.name from ${users} u2 where u2.id = ${messages.recipientId})`.as("recipient_name");
const recipientRoleCols = sql<string>`(select u2.role from ${users} u2 where u2.id = ${messages.recipientId})`.as("recipient_role");

const threadSelect = {
  id: messages.id,
  subject: messages.subject,
  body: messages.body,
  readAt: messages.readAt,
  createdAt: messages.createdAt,
  senderId: messages.senderId,
  recipientId: messages.recipientId,
  parentId: messages.parentId,
  senderName: senderCols,
  senderRole: senderRoleCols,
  recipientName: recipientCols,
  recipientRole: recipientRoleCols,
};

/** Inbox: threads where I'm the recipient (root messages only). */
export async function listInbox(userId: string) {
  return db
    .select(threadSelect)
    .from(messages)
    .where(and(eq(messages.recipientId, userId), isNull(messages.parentId)))
    .orderBy(desc(messages.createdAt));
}

/** Sent: threads I started (root messages only). */
export async function listSent(userId: string) {
  return db
    .select(threadSelect)
    .from(messages)
    .where(and(eq(messages.senderId, userId), isNull(messages.parentId)))
    .orderBy(desc(messages.createdAt));
}

/** Full thread (root + replies), oldest → newest. Null if not a participant. */
export async function getMessageThread(rootId: string, userId: string) {
  const root = await db.query.messages.findFirst({ where: eq(messages.id, rootId) });
  if (!root) return null;
  if (root.senderId !== userId && root.recipientId !== userId) return null;

  return db
    .select(threadSelect)
    .from(messages)
    .where(or(eq(messages.id, rootId), eq(messages.parentId, rootId)))
    .orderBy(asc(messages.createdAt));
}

/** Unread count for the sidebar/page badge. */
export async function getUnreadCount(userId: string) {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(messages)
    .where(and(eq(messages.recipientId, userId), isNull(messages.readAt)));
  return rows[0]?.n ?? 0;
}

/** Who a user can message. Students → staff only; staff → anyone active. */
export async function listMessageTargets(
  userId: string,
  role: "student" | "tutor" | "admin",
): Promise<{ id: string; name: string; role: string }[]> {
  if (role === "student") {
    return db
      .select({ id: users.id, name: users.name, role: users.role })
      .from(users)
      .where(
        and(
          sql`${users.role} != 'student'`,
          eq(users.status, "active"),
          sql`${users.id} != ${userId}`,
        ),
      )
      .orderBy(asc(users.name));
  }
  return db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(and(eq(users.status, "active"), sql`${users.id} != ${userId}`))
    .orderBy(asc(users.role), asc(users.name));
}
