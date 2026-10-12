import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "./helpers";
import { assignmentStatusEnum, attendanceStatusEnum, materialTypeEnum, submissionStatusEnum } from "./enums";
import { batches, courses, timetableSlots } from "./academics";
import { students, tutors, users } from "./users";

export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    slotId: uuid("slot_id").references(() => timetableSlots.id, { onDelete: "set null" }),
    day: date("day").notNull(),
    status: attendanceStatusEnum("status").notNull(),
    notes: text("notes"),
    markedBy: uuid("marked_by").references(() => users.id, { onDelete: "set null" }),
    markedAt: timestamp("marked_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("attendance_student_batch_day_key").on(t.studentId, t.batchId, t.day),
    index("attendance_batch_day_idx").on(t.batchId, t.day),
    index("attendance_student_day_idx").on(t.studentId, t.day),
  ],
);

export const assignments = pgTable(
  "assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    tutorId: uuid("tutor_id")
      .notNull()
      .references(() => tutors.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    instructions: text("instructions").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    attachmentUrl: text("attachment_url"),
    attachmentName: text("attachment_name"),
    points: integer("points").notNull().default(100),
    status: assignmentStatusEnum("status").notNull().default("published"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("assignments_batch_status_idx").on(t.batchId, t.status)],
);

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    content: text("content"),
    fileUrl: text("file_url"),
    fileName: text("file_name"),
    status: submissionStatusEnum("status").notNull().default("submitted"),
    score: numeric("score", { precision: 7, scale: 2 }),
    feedback: text("feedback"),
    gradedBy: uuid("graded_by").references(() => users.id, { onDelete: "set null" }),
    gradedAt: timestamp("graded_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("submissions_assignment_student_key").on(t.assignmentId, t.studentId),
    index("submissions_student_idx").on(t.studentId),
  ],
);

export const materials = pgTable(
  "materials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    batchId: uuid("batch_id").references(() => batches.id, { onDelete: "set null" }),
    tutorId: uuid("tutor_id").references(() => tutors.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    type: materialTypeEnum("type").notNull().default("note"),
    url: text("url").notNull(),
    fileName: text("file_name"),
    fileSize: integer("file_size"),
    tags: text("tags").array(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("materials_course_idx").on(t.courseId), index("materials_batch_idx").on(t.batchId)],
);

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(students, {
    fields: [attendance.studentId],
    references: [students.id],
  }),
  batch: one(batches, {
    fields: [attendance.batchId],
    references: [batches.id],
  }),
  slot: one(timetableSlots, {
    fields: [attendance.slotId],
    references: [timetableSlots.id],
  }),
  markedByUser: one(users, {
    fields: [attendance.markedBy],
    references: [users.id],
  }),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  batch: one(batches, {
    fields: [assignments.batchId],
    references: [batches.id],
  }),
  tutor: one(tutors, {
    fields: [assignments.tutorId],
    references: [tutors.id],
  }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  assignment: one(assignments, {
    fields: [submissions.assignmentId],
    references: [assignments.id],
  }),
  student: one(students, {
    fields: [submissions.studentId],
    references: [students.id],
  }),
  gradedByUser: one(users, {
    fields: [submissions.gradedBy],
    references: [users.id],
  }),
}));

export const materialsRelations = relations(materials, ({ one }) => ({
  course: one(courses, {
    fields: [materials.courseId],
    references: [courses.id],
  }),
  batch: one(batches, {
    fields: [materials.batchId],
    references: [batches.id],
  }),
  tutor: one(tutors, {
    fields: [materials.tutorId],
    references: [tutors.id],
  }),
}));
